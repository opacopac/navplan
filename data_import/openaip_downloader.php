<?php
    $loginUrl = "https://www.openaip.net/user/login";
    $browserAgent = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322)";
    $airportBaseUrl = "http://www.openaip.net/downloads/airports?field_apt_exp_country_value_many_to_one=";
	$airportMinIndex = 1;
	$airportMaxIndex = 2;
	$airportFileRegexp = '/href="(http:\/\/www\.openaip\.net\/.+?\.aip_\d+?)"';

	$ch = curl_init();

	login($ch);

    curl_close($ch);

	die;

    ini_set('user_agent','Mozilla/4.0 (compatible; MSIE 6.0)');

    for ($i = $airportMinIndex; $i <= $airportMaxIndex; $i++)
    {
        $url = $airportBaseUrl . $i;
        $html = file_get_contents($url);

        $numResults = preg_match_all($airportFileRegexp, $html, $matches);

        if (!$numResults || $numResults == 0)
            continue;

        $fileUrl = $matches[1];

        print $fileUrl . "\n";
    }


    function login($ch)
    {
        global $loginUrl, $browserAgent;

        $actionRegExp = '/\$\(form\)\[0\]\.action =\\\'(.+?_form)\\\'/';
        $drupal1RegExp = '';
        $formBuildIdRegExp = '\<input type=\"hidden\" name=\"form_build_id\".+?value=\"(.+?)\"  \/\>';
        $formIdRegExp = '';
        $captchaSidRegExp = '\<input type=\"hidden\" name=\"captcha_sid\" id=\"edit-captcha-sid\" value=\"(.+?)\"  \/\>';
        $captchaTokenRegExp = '\<input type=\"hidden\" name=\"captcha_token\" id=\"edit-captcha-token\" value=\"(.+?)\"  \/\>';


        curl_setopt($ch, CURLOPT_URL, $loginUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, $browserAgent);

        // grab URL and pass it to the browser
        $html = curl_exec($ch);


        preg_match_all($actionRegExp, $html, $matches);
        print $matches[1][0] . "\n";

/*
$(form)[0].action ='/user/login?5bac_name=c7'+v+'7a86ca68e6d52b019_form'
<form action="/user"  accept-charset="UTF-8" method="post" id="user-login">

<div><div class="a22aa_field"><span class="description"> (If you're a human, don't change the following field)</span><div class="form-item" id="edit-822-name-wrapper">
 <label for="edit-822-name">Enter your name: </label>
 <input type="text" maxlength="128" name="822_name" id="edit-822-name" size="60" value="d4981aef0d4" class="form-text a22aa_field" autocomplete="off" />
 <div class="description">Your first name.</div>
</div>

</div><noscript>Please enable Javascript to use this form.</noscript><div class="form-item" id="edit-name-wrapper">
 <label for="edit-name">Username: <span class="form-required" title="This field is required.">*</span></label>
 <input type="text" maxlength="60" name="name" id="edit-name" size="60" value="" class="form-text required" />
 <div class="description">Enter your openAIP username.</div>
</div>

<div class="form-item" id="edit-pass-wrapper">
 <label for="edit-pass">Password: <span class="form-required" title="This field is required.">*</span></label>
 <input type="password" name="pass" id="edit-pass"  maxlength="128"  size="60"  class="form-text required" />
 <div class="description">Enter the password that accompanies your username.</div>
</div>

<input type="hidden" name="form_build_id" id="form-iTH14V3_pfNejDANkJDNsi7ha6mVdLaIXQ8vPVcLRy8" value="form-iTH14V3_pfNejDANkJDNsi7ha6mVdLaIXQ8vPVcLRy8"  />
<input type="hidden" name="form_id" id="edit-user-login" value="user_login"  />
<div class="hidden-captcha"><div class="captcha"><input type="hidden" name="captcha_sid" id="edit-captcha-sid" value="805039"  />
<input type="hidden" name="captcha_token" id="edit-captcha-token" value="f9476cf8c4cd76e9801d90333c552b20"  />
<div class="form-item" id="edit-captcha-response-wrapper">
 <label for="edit-captcha-response">Enter your email here: </label>
 <input type="text" maxlength="128" name="captcha_response" id="edit-captcha-response" size="60" value="" class="form-text" />
</div>
</div></div><input type="submit" name="op" id="edit-submit" value="Log in"  class="form-submit" />
<input type="hidden" name="ba5_name" id="edit-ba5-name" value="32fb30ae9b3"  class="aa5c2_field" />            */
    }
?>