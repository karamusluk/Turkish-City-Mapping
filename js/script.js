$(function () {
  window.CURRENT_VIEW_TYPE = "cities";
  window.CURRENT_VIEW_ID = 1;
  var mapInstance;
  window.MAP_AREAS = {};
  window.VIEW_TYPE_RELATION = {
    city: "country",
    quarter: "city",
    town: "quarter",
  };

  window.PREVIOUS_DATA = {
    viewType: "",
    viewid: -1,
  };

  window.go = (type = "up") => {
    document.getElementById("go-" + type).disabled = false;
    initialize(window.PREVIOUS_DATA);
  };
  let initialize = (props) => {
    props = props || {};
    $.ajax({
      url: "api.php",
      data: {
        viewtype: props.viewtype || window.CURRENT_VIEW_TYPE,
        id: props.viewid || window.CURRENT_VIEW_ID,
      },
      type: "get",
      success: function (data) {
        mapInstance = new google.maps.Map(
          document.getElementById("map-canvas"),
          {
            center: {
              lng: data.mapProps.centeroid.lng || 34.8952522277832,
              lat: data.mapProps.centeroid.lat || 36.91647720336914,
            },
            zoom: data.mapProps.zoom || 8,
          }
        );
        function getBoundCoordinates(a, b) {
          var c = a.getNorthEast().lat(),
            d = a.getNorthEast().lng(),
            e = a.getSouthWest().lat();
          a = a.getSouthWest().lng();
          var f = Math.abs(c - e) * b;
          b *= Math.abs(d - a);
          return {
            north: Math.round(1e6 * (c + f)) / 1e6,
            east: Math.round(1e6 * (d + b)) / 1e6,
            south: Math.round(1e6 * (e - f)) / 1e6,
            west: Math.round(1e6 * (a - b)) / 1e6,
          };
        }

        function stringifyBoundingBoxBounds(bounds, b) {
          a = getBoundCoordinates(bounds, b);
          return [a.north, a.east, a.south, a.west].join();
        }

        data.result.forEach(function (respp, ind) {
          var encoded_data = respp["polygons"];
          if (encoded_data == null || encoded_data == undefined) {
            return;
          }
          google.maps.Polygon.prototype.getBounds = function () {
            for (
              var a = new google.maps.LatLngBounds(),
                b = this.getPaths(),
                c,
                d = 0,
                e;
              d < b.getLength();
              d++
            )
              for (c = b.getAt(d), e = 0; e < c.getLength(); e++)
                a.extend(c.getAt(e));
            return a;
          };
          function H(a) {
            function b(a) {
              a = Math.sin((a * Math.PI) / 180);
              return (
                Math.max(
                  Math.min(Math.log((1 + a) / (1 - a)) / 2, Math.PI),
                  -Math.PI
                ) / 2
              );
            }
            function c(a, b, d) {
              return Math.floor(Math.log(a / b / d) / Math.LN2);
            }
            var d = a.getNorthEast(),
              e = a.getSouthWest();
            a = (b(d.lat()) - b(e.lat())) / Math.PI;

            d = d.lng() - e.lng();
            d = (0 > d ? d + 360 : d) / 360;

            a = c($("#map-canvas").height(), 256, a);
            d = c($("#map-canvas").width(), 256, d);

            return Math.min(a, d, 20);
          }

          mapTooltipInfo = $("#mapTooltipInfo");

          function getNewPositionOfToolTip(a, mapp) {
            var c = mapp
                .getProjection()
                .fromLatLngToPoint(mapp.getBounds().getNorthEast()),
              d = mapp
                .getProjection()
                .fromLatLngToPoint(mapp.getBounds().getSouthWest()),
              e = Math.pow(2, mapp.getZoom());
            a = mapp.getProjection().fromLatLngToPoint(a);
            return new google.maps.Point((a.x - d.x) * e, (a.y - c.y) * e);
          }

          function assingOnClickForTypeView(respp) {
            window.PREVIOUS_DATA = {
              viewType: window.CURRENT_VIEW_TYPE,
              viewid: window.CURRENT_VIEW_ID,
            };
            if (respp.type && respp.type == "city") {
              window.CURRENT_VIEW_TYPE = "town";
              window.CURRENT_VIEW_ID = respp.id;
              window.RERENDER_ALL = true;
              initialize({ viewtype: "town", viewid: window.CURRENT_VIEW_ID });
            } else if (respp.type && respp.type == "town") {
              window.CURRENT_VIEW_TYPE = "quarter";
              window.CURRENT_VIEW_ID = respp.id;
              window.RERENDER_ALL = false;
              initialize({ viewtype: "quarter", viewid: respp.id });
            }
            let viewType = window.VIEW_TYPE_RELATION[respp.type];
            if (typeof viewType == "undefined") {
              document.getElementById("go-up").disabled = true;
            } else {
              document.getElementById("go-up").disabled = false;
            }
          }

          function addPolygon(item) {
            decode = google.maps.geometry.encoding.decodePath(item);
            line = new google.maps.Polygon({
              paths: decode,
              strokeColor: "#777777",
              strokeOpacity: 1,
              strokeWeight: 1,
              fillColor: "#9400D3",
              fillOpacity: 0.5,
              zIndex: 10,
              defaultFillColor: "#9400D3", //#aaaaaa
              defaultFillOpacity: 0.5,
            });

            google.maps.event.clearListeners(line, "mouseover");
            google.maps.event.addListener(line, "mouseover", function (c) {
              var d = this;
              this.setOptions({
                fillColor: "#a6c458",
                fillOpacity: 0.5,
              });
              e =
                "\x3cstrong class\x3d'title'\x3e" +
                respp.name +
                "\x3c/strong\x3e";
              if (typeof respp.districtName != "undefined") {
                e +=
                  "\x3cstrong class\x3d'district'\x3e Semt: " +
                  respp.districtName +
                  "\x3c/strong\x3e";
                console.log(respp.districtName);
              }
              mapTooltipInfo
                .removeClass("disable")
                .html(e)
                .css("marginTop", function () {
                  return -($(this).height() + 10) + "px";
                });
            });

            google.maps.event.clearListeners(line, "mousemove");
            google.maps.event.addListener(line, "mousemove", function (a) {
              a = getNewPositionOfToolTip(a.latLng, mapInstance);
              mapTooltipInfo.css({
                top: a.y,
                left: a.x,
              });
            });
            google.maps.event.clearListeners(line, "mouseout");
            google.maps.event.addListener(line, "mouseout", function () {
              this.setOptions({
                fillOpacity: this.defaultFillOpacity,
                fillColor: this.defaultFillColor,
              });
              mapTooltipInfo.addClass("disable");
            });

            google.maps.event.clearListeners(line, "click");

            google.maps.event.addListener(line, "click", function (a) {
              a = this.getBounds();
              mapInstance.fitBounds(a);
              a = H(a);
              mapInstance.setZoom(a);
              assingOnClickForTypeView(respp);
            });

            line.setMap(mapInstance);
            return line;
          }
          encoded_data.forEach(function (item, index) {
            addPolygon(item);
          });
        });
      },
    });
  };
  initialize();
});
