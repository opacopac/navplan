/**
 * Meteo Service
 */

navplanApp
    .factory('meteoService', meteoService );

meteoService.$inject = ['$http'];

function meteoService($http) {
    var BASE_URL = "php/sma_measurements.php";
    var SVG_NS = "http://www.w3.org/2000/svg";


    // return api reference
    return {
        getSmaMeasurements: getSmaMeasurements,
        getWindArrowSvg: getWindArrowSvg
    };


    function getSmaMeasurements(extent, successCallback, errorCallback) {
        loadSmaMeasurements(extent, onLoadedSuccessfully, onLoadedError);


        function onLoadedSuccessfully(smaMeasurementList) {
            if (successCallback)
                successCallback(smaMeasurementList);
        }


        function onLoadedError() {
            if (errorCallback)
                errorCallback();
        }
    }


    function loadSmaMeasurements(extent, successCallback, errorCallback) {
        var url = BASE_URL + "?minlon=" + extent[0] + "&minlat=" + extent[1] + "&maxlon=" + extent[2] + "&maxlat=" + extent[3];

        $http.get(url)
            .then(
                function (response) // success
                {
                    if (response && response.data && response.data.smameasurements) {
                        if (successCallback)
                            successCallback(response.data.smameasurements);
                    }
                    else {
                        logResponseError("ERROR reading SMA measurements", response);

                        if (errorCallback)
                            errorCallback();
                    }
                },
                function (response) // error
                {
                    logResponseError("ERROR reading SMA smameasurements", response);

                    if (errorCallback)
                        errorCallback();
                }
            );
    }


    function getWindArrowSvg(smaMeasurement)
    {
        var arrWidth = 15;
        var arrHalfWidth = Math.ceil(arrWidth / 2);
        var arrLength = arrHalfWidth + Math.round(smaMeasurement.wind_speed_kmh * 5);
        var lineStyle = "stroke:rgba(0, 0, 0, 1.0); stroke-width:2px;";

        var svg = '';
        svg += '<svg xmlns="' + SVG_NS + '" version="1.1"';
        svg += '  width="' + arrWidth + '" height="' + (arrLength + 10) + '"';
        svg += '  viewbox="0 0 ' + arrWidth + ' ' + (arrLength + 10) + '">';
        svg += '  <defs>';
        svg += '    <marker id="Triangle" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">';
        svg += '      <path d="M 0 0 L 10 5 L 0 10 z" />';
        svg += '    </marker>';
        svg += '  </defs>';
        svg += '  <line x1="' + arrHalfWidth + '" y1="0" x2="' + arrHalfWidth + '" y2="' + arrLength + '" style="' + lineStyle + '" marker-end="url(#Triangle)" />';
        svg += '</svg>';

        return svg;



        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("xmlns", SVG_NS);
        svg.setAttribute("width", arrWidth);
        svg.setAttribute("height", arrLength);

        // arrow shaft
        var shaft = document.createElementNS(SVG_NS, "line");
        shaft.setAttribute("x1", arrHalfWidth);
        shaft.setAttribute("x2", arrHalfWidth);
        shaft.setAttribute("y1", "0");
        shaft.setAttribute("y2", arrLength);
        shaft.setAttribute("style", lineStyle);
        svg.appendChild(shaft);

        // arrow head
        var head1 = document.createElementNS(SVG_NS, "line");
        head1.setAttribute("x1", arrHalfWidth);
        head1.setAttribute("x2", "0");
        head1.setAttribute("y1", arrLength);
        head1.setAttribute("y2", arrLength - arrHalfWidth);
        head1.setAttribute("style", lineStyle);
        svg.appendChild(head1);

        var head1 = document.createElementNS(SVG_NS, "line");
        head1.setAttribute("x1", arrHalfWidth);
        head1.setAttribute("x2", arrWidth);
        head1.setAttribute("y1", arrLength);
        head1.setAttribute("y2", arrLength - arrHalfWidth);
        head1.setAttribute("style", lineStyle);
        svg.appendChild(head1);

        return svg.outerHTML;
    }
}
