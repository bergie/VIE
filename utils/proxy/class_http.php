<?php
/*
* Filename.......: class_http.php
* Author.........: Troy Wolf [troy@troywolf.com]
* Last Modified..: Date: 2006/03/06 10:15:00
* Description....: Screen-scraping class with caching. Includes image_cache.php
                   companion script. Includes static methods to extract data
                   out of HTML tables into arrays or XML. Now supports sending
                   XML requests and custom verbs with support for making
                   WebDAV requests to Microsoft Exchange Server.
*/

class http {
    var $log;
    var $dir;
    var $name;
    var $filename;
    var $url;
    var $port;
    var $verb;
    var $status;
    var $header;
    var $body;
    var $ttl;
    var $headers;
    var $postvars;
    var $xmlrequest;
    var $connect_timeout;
    var $data_ts;
    
    /*
    The class constructor. Configure defaults.
    */ 
    function http() {
        $this->log = "New http() object instantiated.<br />\n";
        
        /*
        Seconds to attempt socket connection before giving up.
        */
        $this->connect_timeout = 30; 
        
        /*
        Seconds to wait for stream to do its thing and return.
        In my experience, if you do nothing, this defaults to 60 seconds.
        Now here is the kicker--if you set this to 10 seconds and the request
        actually takes 83 seconds, your script will sit and wait the entire 83
        seconds before returning the failure! So I'm not sure what the real
        point is. For example, if it takes 83 seconds and does in fact succeed,
        but you had the timeout set at 60, you will return a failure even though
        the communication worked. Point is, set this higher than anything you
        think you'll need. Either way you have to wait!
        */
        $this->stream_timeout = 60;
        
        /*
        Set the 'dir' property to the directory where you want to store the cached
        content. I suggest a folder that is not web-accessible.
        End this value with a "/".
        */
        $this->dir = realpath("./")."/"; //Default to current dir.

        $this->clean();               

        return true;
    }
    
    /*
    fetch() method to get the content. fetch() will use 'ttl' property to
    determine whether to get the content from the url or the cache.
    */
    function fetch($url="", $verb, $name="", $user="", $pwd="", $ttl=0) {
      $this->log .= "--------------------------------<br />fetch() called<br />\n";
        $this->log .= "url: ".$url."<br />\n";
        $this->status = "";
        $this->header = "";
        $this->body = "";
        if (!$url) {
            $this->log .= "OOPS: You need to pass a URL!<br />";
            return false;
        }
        $this->url = $url;
        $this->ttl = $ttl;
        $this->name = $name;
        $need_to_save = false;
        if ($this->ttl == "0") {
            if (!$fh = $this->getFromUrl($url, $user, $pwd, $verb)) {
                return false;
            }
        } else {
            if (strlen(trim($this->name)) == 0) { $this->name = MD5($url); }
            $this->filename = $this->dir."http_".$this->name;
            $this->log .= "Filename: ".$this->filename."<br />";
            $this->getFile_ts();
            if ($this->ttl == "daily") {
                if (date('Y-m-d',$this->data_ts) != date('Y-m-d',time())) {
                    $this->log .= "cache has expired<br />";
                    if (!$fh = $this->getFromUrl($url, $user, $pwd, $verb)) {
                        return false;
                    }
                    $need_to_save = true;
                    if ($this->getFromUrl()) { return $this->saveToCache(); }
                    } else {
                        if (!$fh = $this->getFromCache()) {
                        return false;
                    }
                }
            } else {
                if ((time() - $this->data_ts) >= $this->ttl) {
                    $this->log .= "cache has expired<br />";
                    if (!$fh = $this->getFromUrl($url, $user, $pwd, $verb)) {
                        return false;
                    }
                    $need_to_save = true;
                } else {
                    if (!$fh = $this->getFromCache()) {
                        return false;
                    }
                }
            }
        }
        
        /*
        Get response header.
        */
        $this->header = fgets($fh, 1024);
        $this->status = substr($this->header,9,3);
        while ((trim($line = fgets($fh, 1024)) != "") && (!feof($fh))) {
            $this->header .= $line;
            if ($this->status=="401" and strpos($line,"WWW-Authenticate: Basic realm=\"")===0) {
                fclose($fh);
                $this->log .= "Could not authenticate<br />\n";
                return FALSE;
            }
        }
        
        /*
        Get response body.
        */
        while (!feof($fh)) {
            $this->body .= fgets($fh, 1024);
        }
        fclose($fh);
        if ($need_to_save) { $this->saveToCache(); }
        return $this->status;
    }
    
    /*
    PRIVATE getFromUrl() method to scrape content from url.
    */
    function getFromUrl($url, $user="", $pwd="", $verb="GET") {
        $this->log .= "getFromUrl() called<br />";
        preg_match("~([a-z]*://)?([^:^/]*)(:([0-9]{1,5}))?(/.*)?~i", $url, $parts);
        $protocol = $parts[1];
        $server = $parts[2];
        $port = $parts[4];
        $path = $parts[5];
        $post_string = "";
		if ($port == "") {
            if (strtolower($protocol) == "https://") {
                $port = "443";
            } else {
                $port = "80";
            }
        }

        if ($path == "") { $path = "/"; }
        
        if (!$sock = @fsockopen(((strtolower($protocol) == "https://")?"ssl://":"").$server, $port, $errno, $errstr, $this->connect_timeout)) {
            $this->log .= "Could not open connection. Error "
                .$errno.": ".$errstr."<br />\n";
            return false;
        }
        
        stream_set_timeout($sock, $this->stream_timeout);
        
        $this->headers["Host"] = $server.":".$port;
        
        if ($user != "" && $pwd != "") {
            $this->log .= "Authentication will be attempted<br />\n";
            $this->headers["Authorization"] = "Basic ".base64_encode($user.":".$pwd);
        }
	
        if ($verb == "POST") {
            $this->log .= "Variables will be POSTed<br />\n";
            $request = "POST ".$path." HTTP/1.0\r\n";
	    if (array_key_exists("format", $this->postvars)) {
	      $this->headers["Accept"] = $this->postvars["format"];
	    }
            $post_string = "";
            foreach ($this->postvars as $key=>$value) {
	      if (is_array($value)) {
		foreach ($value as $key2=>$value2) {
		  $post_string .= "&".urlencode($key2)."=".urlencode($value2);
		}
	      }
	      else if ($key != "format") {
                $post_string .= "&".urlencode($key)."=".urlencode($value);
	      }
            }
            $post_string = substr($post_string,1);
	    if ($this->postvars["type"]) {
                $this->headers["Content-Type"] = $this->postvars["type"];
            } else {
                $this->headers["Content-Type"] = "application/x-www-form-urlencoded";
	    }
            $this->headers["Content-Length"] = strlen($post_string);
        } elseif (strlen($this->xmlrequest) > 0) {
            $this->log .= "XML request will be sent<br />\n";
            $request = $verb." ".$path." HTTP/1.0\r\n";
            $this->headers["Content-Length"] = strlen($this->xmlrequest);
        } else {
	    $request = $verb." ".$path." HTTP/1.0\r\n";
	    if (array_key_exists("format", $this->postvars)) {
	      $this->headers["Accept"] = $this->postvars["format"];
	    }
        }

        #echo "<br />request: ".$request;
        if (fwrite($sock, $request) === FALSE) {
            fclose($sock);
            $this->log .= "Error writing request type to socket<br />\n";
            return false;
        }
        
        foreach ($this->headers as $key=>$value) {
            if (fwrite($sock, $key.": ".$value."\r\n") === FALSE) {
                fclose($sock);
                $this->log .= "Error writing headers to socket<br />\n";
                return false;
            }
        }
        
        if (fwrite($sock, "\r\n") === FALSE) {
            fclose($sock);
            $this->log .= "Error writing end-of-line to socket<br />\n";
            return false;
        }
        
        #echo "<br />post_string: ".$post_string;
        if (count($this->postvars) > 0) {
            if (fwrite($sock, $post_string."\r\n") === FALSE) {
                fclose($sock);
                $this->log .= "Error writing POST string to socket<br />\n";
                return false;
            }
        } elseif (strlen($this->xmlrequest) > 0) {
            if (fwrite($sock, $this->xmlrequest."\r\n") === FALSE) {
                fclose($sock);
                $this->log .= "Error writing xml request string to socket<br />\n";
                return false;
            }
        }
        
        return $sock;
    }
    
    /*
    PRIVATE clean() method to reset the instance back to mostly new state.
    */
    function clean()
    {
        $this->status = "";
        $this->header = "";
        $this->body = "";
        $this->headers = array();
        $this->postvars = array();
        /*
        Try to use user agent of the user making this request. If not available,
        default to IE6.0 on WinXP, SP1.
        */
        if (isset($_SERVER['HTTP_USER_AGENT'])) {
            $this->headers["User-Agent"] = $_SERVER['HTTP_USER_AGENT'];
        } else {
            $this->headers["User-Agent"] = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)";
        }
        
        /*
        Set referrer to the current script since in essence, it is the referring
        page.
        */
        if (substr($_SERVER['SERVER_PROTOCOL'],0,5) == "HTTPS") {
            $this->headers["Referer"] = "https://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
        } else {
            $this->headers["Referer"] = "http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
        }
    }
    
    /*
    PRIVATE getFromCache() method to retrieve content from cache file.
    */
    function getFromCache() {
        $this->log .= "getFromCache() called<br />";
        //create file pointer
        if (!$fp=@fopen($this->filename,"r")) {
            $this->log .= "Could not open ".$this->filename."<br />";
            return false;
        }
        return $fp;
    }
    
    /*
    PRIVATE saveToCache() method to save content to cache file.
    */
    function saveToCache() {
        $this->log .= "saveToCache() called<br />";
        
        //create file pointer
        if (!$fp=@fopen($this->filename,"w")) {
            $this->log .= "Could not open ".$this->filename."<br />";
            return false;
        }
        //write to file
        if (!@fwrite($fp,$this->header."\r\n".$this->body)) {
            $this->log .= "Could not write to ".$this->filename."<br />";
            fclose($fp);
            return false;
        }
        //close file pointer
        fclose($fp);
        return true;
    }
    
    /*
    PRIVATE getFile_ts() method to get cache file modified date.
    */
    function getFile_ts() {
        $this->log .= "getFile_ts() called<br />";
        if (!file_exists($this->filename)) {
            $this->data_ts = 0;
            $this->log .= $this->filename." does not exist<br />";
            return false;
        }
        $this->data_ts = filemtime($this->filename);
        return true;
    }
    
    /*
    Static method table_into_array()
    Generic function to return data array from HTML table data
    rawHTML: the page source
    needle: optional string to start parsing source from
    needle_within: 0 = needle is BEFORE table, 1 = needle is within table
    allowed_tags: list of tags to NOT strip from data, e.g. "<a><b>"
    */
    function table_into_array($rawHTML,$needle="",$needle_within=0,$allowed_tags="") {
        $upperHTML = strtoupper($rawHTML);
        $idx = 0;
        if (strlen($needle) > 0) {
            $needle = strtoupper($needle);
            $idx = strpos($upperHTML,$needle);
            if ($idx === false) { return false; }
            if ($needle_within == 1) {
                $cnt = 0;
                while(($cnt < 100) && (substr($upperHTML,$idx,6) != "<TABLE")) {
                    $idx = strrpos(substr($upperHTML,0,$idx-1),"<");
                    $cnt++;
                }
            }
        }
        $aryData = array();
        $rowIdx = 0;
        /*	If this table has a header row, it may use TD or TH, so 
        check special for this first row. */
        $tmp = strpos($upperHTML,"<TR",$idx);
        if ($tmp === false) { return false; }
        $tmp2 = strpos($upperHTML,"</TR>",$tmp);
        if ($tmp2 === false) { return false; }
        $row = substr($rawHTML,$tmp,$tmp2-$tmp);
        $pattern = "/<TH>|<TH\ |<TD>|<TD\ /";
        preg_match($pattern,strtoupper($row),$matches);
        $hdrTag = $matches[0];
        
        while ($tmp = strpos(strtoupper($row),$hdrTag) !== false) {
            $tmp = strpos(strtoupper($row),">",$tmp);
            if ($tmp === false) { return false; }
            $tmp++;
            $tmp2 = strpos(strtoupper($row),"</T");
            $aryData[$rowIdx][] = trim(strip_tags(substr($row,$tmp,$tmp2-$tmp),$allowed_tags));
            $row = substr($row,$tmp2+5);
            preg_match($pattern,strtoupper($row),$matches);
            $hdrTag = $matches[0];
        }
        $idx = strpos($upperHTML,"</TR>",$idx)+5;
        $rowIdx++;
        
        /* Now parse the rest of the rows. */
        $tmp = strpos($upperHTML,"<TR",$idx);
        if ($tmp === false) { return false; }
        $tmp2 = strpos($upperHTML,"</TABLE>",$idx);
        if ($tmp2 === false) { return false; }
        $table = substr($rawHTML,$tmp,$tmp2-$tmp);
        
        while ($tmp = strpos(strtoupper($table),"<TR") !== false) {
            $tmp2 = strpos(strtoupper($table),"</TR");
            if ($tmp2 === false) { return false; }
            $row = substr($table,$tmp,$tmp2-$tmp);
            
            while ($tmp = strpos(strtoupper($row),"<TD") !== false) {
            $tmp = strpos(strtoupper($row),">",$tmp);
            if ($tmp === false) { return false; }
            $tmp++;
            $tmp2 = strpos(strtoupper($row),"</TD");
            $aryData[$rowIdx][] = trim(strip_tags(substr($row,$tmp,$tmp2-$tmp),$allowed_tags));
            $row = substr($row,$tmp2+5);
            }
            $table = substr($table,strpos(strtoupper($table),"</TR>")+5);
            $rowIdx++;
        }
        return $aryData;
    }
    
    /*
    Static method table_into_xml()
    Generic function to return xml dataset from HTML table data
    rawHTML: the page source
    needle: optional string to start parsing source from
    allowedTags: list of tags to NOT strip from data, e.g. "<a><b>"
    */
    function table_into_xml($rawHTML,$needle="",$needle_within=0,$allowedTags="") {
        if (!$aryTable = http::table_into_array($rawHTML,$needle,$needle_within,$allowedTags)) { return false; }
        $xml = "<?xml version=\"1.0\" standalone=\"yes\" \?\>\n";
        $xml .= "<TABLE>\n";
        $rowIdx = 0;
        foreach ($aryTable as $row) {
            $xml .= "\t<ROW id=\"".$rowIdx."\">\n";
            $colIdx = 0;
            foreach ($row as $col) {
                $xml .= "\t\t<COL id=\"".$colIdx."\">".trim(utf8_encode(htmlspecialchars($col)))."</COL>\n";
                $colIdx++;
            }
            $xml .= "\t</ROW>\n";
            $rowIdx++;
        }
        $xml .= "</TABLE>";
        return $xml;
    }
}

?>
