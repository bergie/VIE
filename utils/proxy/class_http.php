<?php
/*
* Filename.......: class_http.php
* Author.........: Troy Wolf [troy@troywolf.com], Sebastian Germesin [sebastian.germesin@dfki.de]
* Last Modified..: Date: 2011/09/12 10:52:00
* Description....: PHP Proxy
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
        
        $this->clean();               

        return true;
    }
    
    /*
    fetch() method to get the content. fetch() will use 'ttl' property to
    determine whether to get the content from the url or the cache.
    */
    function fetch($url="", $verb, $name="", $user="", $pwd="", $ttl=0) {
      $this->log .= "--------------------------------<br />\nfetch() called<br />\n";
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
	error_log($this->ttl);
        if ($this->ttl == "0") {
            if (!$fh = $this->getFromUrl($url, $user, $pwd, $verb)) {
                return false;
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
        $this->log .= "getFromUrl() called<br />\n";
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
        $this->log .= "Contacting: " . $protocol . $server.":".$port . "\n";
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
	    $ignore = array("format", "type", "verb", "proxy_url");
            $post_string = "";
            foreach ($this->postvars as $key=>$value) {
	      if (!in_array($key, $ignore)) {
		if (is_array($value)) {
		  foreach ($value as $key2=>$value2) {
		    $post_string .= "&" . urlencode($key2) . "=" . urlencode($value2);
		  }
		}
		else {
		  $post_string .= "&" . urlencode($key) . "=". urlencode($value);
		}
	      }
            }
            $post_string = substr($post_string,1);
	    $this->log .= "Post String:'" . $post_string . "'!\n";
	    if (array_key_exists("type", $this->postvars)) {
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

	error_log($this->log);
        
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
}

?>
