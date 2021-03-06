'use strict';
(function() {
    var t = klp.map = {};
    var window_width,
        $mobile_details_wrapper,
        $_filter_layers_list,
        $_filter_layers_button,
        $radiusButton,
        map,
        marker_overlay_html;

    var tpl_map_popup;
    var tpl_mobile_place_details;
    var map_voluteer_date = false;
    var mapIcon = klp.utils.mapIcon;
    var mapBbox;


    var state = {
        'addPopupCloseHistory': true
    };

    //Get the state code that is set from the templates
    var state_code = window.klp.STATE_CODE;

    var stateLatLongs = {
        "ka": {"SW_lat": 11.57, 
               "SW_long": 73.87,
               "NE_lat": 18.45, 
               "NE_long": 78.57,
               "default_lat":12.9793998, 
               "default_long":77.5903608
            },
        "od": {
            "SW_lat": 17.839831,  
            "SW_long": 81.405900,
            "NE_lat": 21.756571, 
            "NE_long": 87.409928,
            "default_lat":20.296059, 
            "default_long":85.824539
        },
        "jk" : {
            "SW_lat": 32.776456, 
            "SW_long": 79.486463,
            "NE_lat": 35.919102, 
            "NE_long": 72.504737,
            "default_lat":34.087733, 
            "default_long":74.797132
        }
    };
    // console.log("State is: ", state_code)
    // console.log("State lat longs", stateLatLongs[state_code])

    var districtLayer,
        preschoolDistrictLayer,
        blockLayer,
        clusterLayer,
        projectLayer,
        circleLayer,
        schoolCluster,
        preschoolCluster,
        radiusLayer,
        popupInfoXHR,
        preschoolXHR,
        schoolXHR;

    //Keeps track of layers currently on map.
    var mapLayers = {};

    //Keep track of last zoom
    var lastZoom = '';

    //Disabled and enabled are layers disabled / enabled in layer switcher
    //on right panel
    var disabledLayers,
        enabledLayers,
        allLayers,
        //This temporarily holds the duplicated entity of the entity that
        //is "selected" - i.e. has its popup showing.
        selectedLayers;

    var isMobile = $(window).width() < 768;

    var filterGeoJSON = klp.utils.filterGeoJSON;

    var getLayerFromName = function(name) {
        var invertedMapLayers = _.invert(mapLayers);
        var layerID = invertedMapLayers[name];

        //FIX ME: This is ugly.
        return allLayers._layers[layerID];
    };

    //Defines what boundary layers to show at which zoom level
    var boundaryZoomLevels = {
        'district': 8,
        'block': 9,
        'project': 9,
        'pincode': 9,
        'cluster': 10,
        'circle': 10
    };

    var schoolDistrictMap = {
        'primaryschool': 'Primary School',
        'preschool': 'Preschool',
        'primary': 'Primary School',
        'pre': 'Preschool'
    };

    t.init = function() {

        //Event handler to close popup
        $(document).on('click', '.js-map-popup-close', function(e) {
            e.preventDefault();
            map.closePopup();
        });
        // Search.
        var $searchInput = $(".search-input");

        //Instantiates search box with select2 autocomplete widget.
        $searchInput.select2({
            placeholder: 'Search for schools, boundaries and PIN codes',
            minimumInputLength: 3,
            ajax: {
                url: "/api/v1/search",
                quietMillis: 300,
                allowClear: true,
                data: function (term, page) {
                    return {
                        text: term,
                        geometry: 'yes'
                    };
                },

                /*
                  Function that gets called with data from API
                  and formats results for select2
                */
                results: function (data, page) {
                    var searchResponse = {
                        results: [
                        {
                            text: "Pre-Schools",
                            children: makeResults(data.pre_schools.features, 'school')
                        },
                        {
                            text: "Primary Schools",
                            children: makeResults(data.primary_schools.features, 'school')
                        },
                        {
                            text: "Boundaries",
                            children: makeResults(data.boundaries.features, 'boundary')
                        },
                        {
                            text: "Parliaments",
                            children: makeResults(data.parliaments.features, 'parliament')
                        },
                        {
                            text: "Assemblies",
                            children: makeResults(data.assemblies.features, 'assembly')
                        },
                        {
                            text: "PIN codes",
                            children: makeResults(data.pincodes.features, 'pincode')
                        }
                        ]
                    };
                    return {results: searchResponse.results};
                }
            }
        });

        //Function called when user selects an entity from search drop-down
        $searchInput.on('change', function(choice) {
            var data = choice.added.data;
            //console.log(data);
            var searchPoint;
            var searchGeometryType = data.geometry.type;
            var searchGeometry = data.geometry.coordinates;
            var searchEntityType = data.entity_type;

            if (map._popup) {
                state.addPopupCloseHistory = false;
            }

            selectedLayers.clearLayers();

            if (searchEntityType === 'school') {
                searchPoint = L.latLng(data.geometry.coordinates[1], data.geometry.coordinates[0]);
                var marker = L.marker(searchPoint, {icon: mapIcon(data.properties.type)});
                markerPopup(marker, data);
                map.setView(searchPoint, 14);
            }

            if (searchEntityType === 'boundary') {
                klp.router.setHash(null, {marker: 'boundary-'+data.properties.id}, {trigger: false});
                var boundaryType = data.properties.type;
                searchPoint = L.latLng(searchGeometry[1], searchGeometry[0]);
                setBoundaryResultsOnMap(boundaryType, searchPoint, data);
            }
            if (searchEntityType === 'pincode'  || searchEntityType === 'parliament' || searchEntityType === 'assembly') {
                var urlID = data.properties.id;
                if (searchEntityType === 'pincode') {
                    urlID = data.properties.pincode;
                }
                klp.router.setHash(null, {marker: searchEntityType+'-'+urlID}, {trigger: false});
                var searchLayer = L.geoJson(data);
                searchLayer.addTo(selectedLayers);
                var geomBounds = searchLayer.getBounds();
                map.fitBounds(geomBounds);
            }
        });

        function setBoundaryResultsOnMap(type, point, data) {
            var marker;
            if (type === 'district') {
                var schoolType = data.properties.school_type;
                marker = L.marker(point, {icon: mapIcon(schoolType+'_district')});
            } else {
                marker = L.marker(point, {icon: mapIcon(type)});
            }
            /*marker.bindPopup(data.properties.name);
            marker.addTo(selectedLayers).openPopup();
            map.setView(point, boundaryZoomLevels[type]);*/
            markerBoundary(marker,data);
        }

        function makeResults(array, type) {
            return _(array).map(function(obj) {
                var name = obj.properties.name;
                if (type === 'boundary') {
                    if (obj.properties.boundary_type === 'SD') {
                        name = obj.properties.name + ' - ' + schoolDistrictMap[obj.properties.type];
                    } else {
                        name = obj.properties.name + ' - ' + obj.properties.type;
                    }
                }
                if (type === 'pincode') {
                    name = obj.properties.pincode;
                }

                obj.entity_type = type;
                return {
                    id: obj.properties.id,
                    text: _.str.titleize(name),
                    data: obj
                };
            });
        }

        klp.router.events.on('hashchange', function (event, params) {
            var url = params.url,
                oldURL = params.oldURL;
            if (url === '') {
                setURL();
            } else {
                if (oldURL !== url) {
                    //currentURL = url;
                    var urlSplit = url.split('/');
                    var urlZoom = urlSplit[0];
                    var urlLatLng = L.latLng(urlSplit[1], urlSplit[2]);
                    map.setView(urlLatLng, urlZoom);

                }
            }
        });

        klp.router.events.on('hashchange:marker', function (event, params) {
            var queryParams = params.queryParams,
                changed = params.changed;
            if (map._popup) {
                state.addPopupCloseHistory = false;
            }
            if (changed.marker.oldVal && !changed.marker.newVal) {
                map.closePopup();
                return;
            }
            var urlMarker = queryParams.marker.split('-');
            var entityType = urlMarker[0];
            var entityID = urlMarker[1];

            selectedLayers.clearLayers();

            if (entityType === 'primaryschool' || entityType === 'preschool') {
                var thisSchoolXHR = klp.api.do('institutions/'+entityID, {'geometry': 'yes'});
                thisSchoolXHR.done(function(data) {
                    var thisSchoolMarker = L.geoJson(data, {
                        pointToLayer: function(feature, latlng) {
                            map.setView(latlng);
                            return L.marker(latlng, {icon: mapIcon(entityType)});
                        },
                        onEachFeature: function(feature, layer) {
                            markerPopup(layer, feature);
                        }
                    }).addTo(map);
                });
            } else if (entityType === 'pincode' || entityType === 'parliament' || entityType === 'assembly') {
                var urlString = entityType+'/'+entityID;
                var thisEntityXHR = klp.api.do('boundary/'+urlString, {'geometry':
                    'yes'});
                thisEntityXHR.done(function(data) {
                    var thisEntityPolygon = L.geoJson(data);
                    thisEntityPolygon.addTo(selectedLayers);
                    var geomBounds = selectedLayers.getBounds();
                    map.fitBounds(geomBounds);
                });
            } else if (entityType === 'boundary') {
                var thisEntityXHR = klp.api.do('boundary/admin/'+entityID, {'geometry': 'yes'});
                thisEntityXHR.done(function(data) {
                    var iconType = data.properties.school_type+'_'+data.properties.type;
                    // console.log('iconType', iconType);
                    var thisEntityMarker = L.geoJson(data, {
                        pointToLayer: function(feature, latlng) {
                            map.setView(latlng);
                            return L.marker(latlng, {icon: mapIcon(iconType)});
                        },
                        onEachFeature: onEachBoundary
                    });
                    /*thisEntityMarker.bindPopup(data.properties.name);
                    thisEntityMarker.addTo(selectedLayers);
                    thisEntityMarker.openPopup();*/
                });
            }
        });


        window_width = $(window).width();
        tpl_map_popup = swig.compile($("#tpl-map-popup").html());
        tpl_mobile_place_details = swig.compile($(
            "#tpl_mobile_place_details").html());
        $mobile_details_wrapper = $("#mobile-details-wrapper");
        $mobile_details_wrapper.on("click", ".js-close-details", function(e) {
            e.preventDefault();
            $mobile_details_wrapper.removeClass("show");
            klp.router.setHash(null, {marker: null});
            document.title = 'School Map';


        });

        var map_overlay_top = $(".main-header").height() + 20 + 100;
        $("#map_overlay").css({
            'top': map_overlay_top + 'px'
        });

        load_map();

        disabledLayers = L.layerGroup();
        enabledLayers = L.layerGroup().addTo(map);
        selectedLayers = L.featureGroup().addTo(map);

        preschoolCluster = L.markerClusterGroup({chunkedLoading: true,removeOutsideVisibleBounds: true, showCoverageOnHover: false, iconCreateFunction: function(cluster) {
            return new L.DivIcon({ className:'marker-cluster marker-cluster-preschool', style:'style="margin-left: -20px; margin-top: -20px; width: 40px; height: 40px; transform: translate(293px, 363px); z-index: 363;"', html: "<div><span>" + cluster.getChildCount() + "</span></div>" });
            }}).addTo(enabledLayers);


        schoolCluster = L.markerClusterGroup({chunkedLoading: true, removeOutsideVisibleBounds: true, showCoverageOnHover: false, iconCreateFunction: function(cluster) {
            return new L.DivIcon({ className:'marker-cluster marker-cluster-school', style:'style="margin-left: -20px; margin-top: -20px; width: 40px; height: 40px; transform: translate(293px, 363px); z-index: 363;"', html: "<div><span>" + cluster.getChildCount() + "</span></div>" });
            }}).addTo(enabledLayers);

        var districtXHR = klp.api.do('boundary/admin1s', {'school_type':'primary', 'geometry': 'yes', 'per_page': 0});

        var preschoolDistrictXHR = klp.api.do('boundary/admin1s', {'school_type': 'pre', 'geometry': 'yes', 'per_page': 0});

        var blockXHR = klp.api.do('boundary/admin2s', {'school_type': 'primary', 'geometry': 'yes', 'per_page': 0});

        var projectXHR = klp.api.do('boundary/admin2s', {'school_type': 'pre', 'geometry': 'yes', 'per_page': 0});

        var clusterXHR = klp.api.do('boundary/admin3s', {'school_type': 'primary', 'geometry': 'yes', 'per_page': 0});

        var circleXHR = klp.api.do('boundary/admin3s', {'school_type': 'pre', 'geometry': 'yes', 'per_page': 0});

        function onEachSchool(feature, layer) {
            if (feature.properties) {
                layer.on('click', function(e) {
                    markerPopup(this, feature);
                    //setMarkerURL(feature);
                });
            }
        }

        function onEachBoundary(feature, layer) {
            if (feature.properties) {
                layer.on('click', function(e) {
                    markerBoundary(this, feature);
                    //setMarkerURL(feature);
                });
            }
        }

        function setMarkerURL(feature) {
            var type = feature.properties.type;
            var schoolID = feature.properties.id;
            var opts = {
                trigger: false,
            }
            if (type.id === "primary") {
                var markerParam = 'primaryschool-' + schoolID;
            } else {
                var markerParam = 'preschool-' + schoolID;
            }
            if (type.id === "primary") {
                klp.router.setHash(null, {marker: markerParam}, opts);
            } else {
                klp.router.setHash(null, {marker: markerParam}, opts);
            }
        }

        function onEachFeature(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(_.str.titleize(feature.properties.name));
            }
        }

        function loadPointsByBbox() {
            var bbox = map.getBounds();
            if (mapBbox && mapBbox.contains(bbox)) {
                return;
            }

            var bboxString = map.getBounds().pad(0.5).toBBoxString();
            mapBbox = bbox.pad(0.5);

            if (preschoolXHR && preschoolXHR.state() === 'pending') {
                preschoolXHR.abort();
            }

            if (schoolXHR && schoolXHR.state() === 'pending') {
                schoolXHR.abort();
            }


            if (enabledLayers.hasLayer(preschoolCluster)) {
                t.startLoading();
                preschoolXHR = klp.api.do('institutions/list', {'lean': 'true', 'school_type': 'preschools', 'geometry': 'yes', 'per_page': 0, 'bbox': bboxString});
                preschoolXHR.done(function (data) {
                    t.stopLoading();
                    preschoolCluster.clearLayers();
                    var preschoolLayer = L.geoJson(filterGeoJSON(data), {
                        pointToLayer: function(feature, latlng) {
                            return L.marker(latlng, {icon: mapIcon('preschool')});
                        },
                        onEachFeature: onEachSchool
                    }).addTo(preschoolCluster);
                });
            }

            if (enabledLayers.hasLayer(schoolCluster)) {
                t.startLoading();
                schoolXHR = klp.api.do('institutions/list', {'lean': 'true', 'school_type': 'primaryschools', 'geometry': 'yes', 'per_page': 0, 'bbox': bboxString});
                schoolXHR.done(function (data) {
                    t.stopLoading();
                    schoolCluster.clearLayers();
                    var schoolLayer = L.geoJson(filterGeoJSON(data), {
                        pointToLayer: function(feature, latlng) {
                            return L.marker(latlng, {icon: mapIcon('school')});
                        },
                        onEachFeature: onEachSchool
                    }).addTo(schoolCluster);
                });
            }
        }

        loadPointsByBbox();

        districtLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('school_district')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        preschoolDistrictLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('preschool_district')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        blockLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('school_block')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        clusterLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('school_cluster')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        projectLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('preschool_project')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        circleLayer = L.geoJson(null, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {icon: mapIcon('preschool_circle')});
            },
            //onEachFeature: onEachFeature
            onEachFeature: onEachBoundary
        });

        districtXHR.done(function (data) {
            districtLayer.addData(filterGeoJSON(data));
            districtLayer.addTo(disabledLayers);
        });

        preschoolDistrictXHR.done(function (data) {
            preschoolDistrictLayer.addData(filterGeoJSON(data));
            preschoolDistrictLayer.addTo(disabledLayers);
        });

        blockXHR.done(function (data) {
            blockLayer.addData(filterGeoJSON(data));
            blockLayer.addTo(disabledLayers);
        });

        clusterXHR.done(function (data) {
            clusterLayer.addData(filterGeoJSON(data));
            clusterLayer.addTo(disabledLayers);
        });

        projectXHR.done(function (data) {
            projectLayer.addData(filterGeoJSON(data));
            projectLayer.addTo(disabledLayers);
        });

        circleXHR.done(function (data) {
            circleLayer.addData(filterGeoJSON(data));
            circleLayer.addTo(disabledLayers);
        });

        function getSchoolType(feature) {
            var schoolType = feature.properties.type;
            if(schoolType == 'primary') {
                schoolType = 'primaryschool'
            }
            else {
                schoolType = 'preschool'
            }
            return schoolType
        }

        function getBoundaryType(feature) {
            var boundary_type = feature.properties.boundary_type;
            var modified_boundary_type = boundary_type;
            if(boundary_type == 'SD' || boundary_type == "PD") {
                modified_boundary_type = "district";
            }
            else if(boundary_type == 'SB') {
                modified_boundary_type = "block"
            }
            else if(boundary_type == 'SC') {
                modified_boundary_type = "cluster"
            }
            else if(boundary_type == 'PP') {
                modified_boundary_type = "project"
            }
            else if(boundary_type == 'PC') {
                modified_boundary_type = "circle"
            }
            return modified_boundary_type;
        }

        function markerBoundary(marker, feature) {
            var duplicatemarker;
            //Since boundary type and school type have changed, need to map new
            //types to old for the sake of icon names. Revisit later if needed // simplify
            var boundary_type = getBoundaryType(feature)
            var schoolType = getSchoolType(feature)
            duplicatemarker = L.marker(marker._latlng, {icon: mapIcon(schoolType +'_' + boundary_type)});

            selectedLayers.addLayer(duplicatemarker);
            if (map._popup) {
                state.addPopupCloseHistory = false;
            }
            var  popupBoundaryXHR = klp.api.do('aggregation/boundary/'+feature.properties.id + '/schools/', {'geometry': 'yes'});
            popupBoundaryXHR.done(function(data) {
                var props = data.properties;
                var iconType = props.boundary.school_type + '_' + props.boundary.type;
                var boundaryData = {
                                    "id": props.boundary.id,
                                    "name": props.boundary.name,
                                    "type": props.boundary.type,
                                    "school_type": props.boundary.type
                                   };
                if (props.boundary.boundary_type !== 'SD') {
                    boundaryData["parentType"] = props.boundary.parent_boundary.boundary_type;
                    boundaryData["parentName"] = props.boundary.parent_boundary.name;
                }
                boundaryData["num_boys"] = props.num_boys;
                boundaryData["num_girls"] = props.num_girls;
                boundaryData["total_students"] = props.num_boys + props.num_girls;
                boundaryData["num_schools"] = props.num_schools;
                console.log(boundaryData)
                var tpl_map_boundary_popup = swig.compile($("#tpl-map-boundary-popup").html());
                duplicatemarker.bindPopup(tpl_map_boundary_popup(boundaryData),{maxWidth:300, minWidth:300}).openPopup();

                //marker.addTo(selectedLayers).openPopup();
                setMarkerURL(feature);
                /*document.title = "School: " + feature.properties.name;
                        $('.js-trigger-compare').unbind('click');
                        $('.js-trigger-compare').click(function(e) {
                            e.preventDefault();
                            klp.comparison.open(data);
                        });*/
                //map.setView(marker._latlng, boundaryZoomLevels[boundary_type]);
                map.setView(marker._latlng);
            });
        }

        function markerPopup(marker, feature) {
            var duplicateMarker;
            if (feature.properties.type === "primary") {
                duplicateMarker = L.marker(marker._latlng, {icon: mapIcon('school')});
            } else {
                duplicateMarker = L.marker(marker._latlng, {icon: mapIcon('preschool')});
            }
            selectedLayers.addLayer(duplicateMarker);
            if (map._popup) {
                state.addPopupCloseHistory = false;
            }
            t.startLoading();
            popupInfoXHR = klp.api.do('institutions/'+feature.properties.id, {});
            popupInfoXHR.done(function(data) {
                //To fetch additional facilities data from the DISE API.
                var facilitiesXHR = fetchBasicFacilities(data);
                facilitiesXHR.done(function(basicFacilities) {
                    t.stopLoading();
                    data.basic_facilities = basicFacilities;
                    if(data.basic_facilities){
                        data.has_basic_facilities = data.basic_facilities.computer_lab ||
                                                    data.basic_facilities.library ||
                                                    data.basic_facilities.playground ||
                                                    data.has_volunteer_activities;
                        }
                    data.total_students = getTotalStudents(data);
                    duplicateMarker.bindPopup(tpl_map_popup(data), {maxWidth:300, minWidth:300}).openPopup();
                    setMarkerURL(feature);
                    document.title = "School: " + feature.properties.name;
                    $('.js-trigger-compare').unbind('click');
                    $('.js-trigger-compare').click(function(e) {
                        e.preventDefault();
                        klp.comparison.open(data);
                    });
                });
            });
        }

        function fetchBasicFacilities(data) {
            var $deferred = $.Deferred();
            if (data.type.id === "pre") { //is a preschool
                setTimeout(function() {
                    $deferred.resolve(data.basic_facilities);
                }, 0);
            } else {
                var facilitiesXHR = klp.dise_api.fetchSchoolInfra(data.dise_code);
                facilitiesXHR.done(function(diseData) {
                    if (diseData.hasOwnProperty('properties')) {
                        var basicFacilities = klp.dise_infra.getBasicFacilities(diseData.properties);
                        $deferred.resolve(basicFacilities);
                    } else {
                        $deferred.resolve({});
                    }
                });
                facilitiesXHR.fail(function(err) {
                    klp.utils.alertMessage("Temporary error fetching basic facilities data for this school.");
                    $deferred.resolve({});
                });
            }
            return $deferred;
        }

        function getTotalStudents(data) {
            var boys = data.num_boys ? data.num_boys : 0;
            var girls = data.num_girls ? data.num_girls : 0;
            return parseInt(boys) + parseInt(girls);

        }

        var overlays = {
            '<span class="brand-school"><span class="icon-button-round-sm"><span class="k-icon">s</span></span> <span class="font-small">SCHOOL</span></span>': schoolCluster,
            '<span class="brand-preschool"><span class="icon-button-round-sm"><span class="k-icon">p</span></span> <span class="font-small">PRESCHOOL</span>': preschoolCluster,
            '<span class="brand-school-district"><span class="icon-button-round-sm"><span class="k-icon">sd</span></span> <span class="font-small">SCHOOL DISTRICT</span>': districtLayer,
            '<span class="brand-preschool-district"><span class="icon-button-round-sm"><span class="k-icon">pd</span></span> <span class="font-small">PRESCHOOL DISTRICT</span>': preschoolDistrictLayer,
            '<span class="brand-school-block"><span class="icon-button-round-sm"><span class="k-icon">sb</span></span> <span class="font-small">SCHOOL BLOCK</span>': blockLayer,
            '<span class="brand-school-cluster"><span class="icon-button-round-sm"><span class="k-icon">sc</span></span> <span class="font-small">SCHOOL CLUSTER</span>': clusterLayer,
            '<span class="brand-preschool-project"><span class="icon-button-round-sm"><span class="k-icon">pp</span></span> <span class="font-small">PRESCHOOL PROJECT</span>': projectLayer,
            '<span class="brand-preschool-circle"><span class="icon-button-round-sm"><span class="k-icon">pc</span></span> <span class="font-small">PRESCHOOL CIRCLE</span>': circleLayer

        };

        L.control.layers({}, overlays, {collapsed: true}).addTo(map);

        mapLayers[preschoolCluster._leaflet_id] = 'preschool' ;
        mapLayers[schoolCluster._leaflet_id] = 'school';
        mapLayers[districtLayer._leaflet_id] = 'district';
        mapLayers[preschoolDistrictLayer._leaflet_id] = 'preschooldistrict';
        mapLayers[blockLayer._leaflet_id] = 'block';
        mapLayers[clusterLayer._leaflet_id] = 'cluster';
        mapLayers[circleLayer._leaflet_id] = 'circle';
        mapLayers[projectLayer._leaflet_id] = 'project';

        allLayers = L.layerGroup([preschoolCluster, schoolCluster, districtLayer, preschoolDistrictLayer, blockLayer, clusterLayer, projectLayer, circleLayer]);


       // Radius tool.
        // Initialise the FeatureGroup to store editable layers
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            position: 'bottomright',
            draw: {
                polyline: false,
                polygon: false,
                rectangle: false,
                marker: false,
                circle: true
            },
            edit: {
                featureGroup: drawnItems,
                edit: false,
                remove: false
            }
        });
        map.addControl(drawControl);

        // Control for Filters.

        var filterControl = L.Control.extend({
            options: {
                position: 'bottomright'
            },

            onAdd: function(map) {
                var container = L.DomUtil.create('div', 'leaflet-control filter-control');
                container.title = 'Filter Schools';
                var button = "<a class='js-filter-tool filter-tool' href='#'></a>";
                container.innerHTML = button;
                L.DomEvent
                .addListener(container, 'click', L.DomEvent.stopPropagation)
                .addListener(container, 'click', L.DomEvent.preventDefault)
                .addListener(container, 'click', this.onClick);

                return container;
            },

            onClick: function(e) {
                L.DomUtil.addClass(e.target, 'active');
                klp.filters_modal.open();
            }
        });

        map.addControl(new filterControl());



        // Map Events
        map.on('zoomend', updateLayers);
        map.on('moveend', _.debounce(function() {
            loadPointsByBbox();
            setURL();
        }, 300));

        map.on('popupclose', function(e) {
            //If we don't wrap this in a setTimeout, there is some
            //some strange race condition in leaflet since we are calling
            //clearLayers() on selectedLayers inside the select2 onchange
            //which conflicts with this, but is okay if we wrap in a setTimeout
            //FIXME: but really not sure how to fix.
            setTimeout(function() {
                selectedLayers.removeLayer(e.popup._source);
            }, 0);
            if (state.addPopupCloseHistory) {
                klp.router.setHash(null, {marker: null}, {trigger: false});
                document.title = "School Map";
            } else {
                state.addPopupCloseHistory = true;
            }
        });

        map.on('draw:drawstart', function (e) {
            $radiusButton = $('.leaflet-draw-draw-circle');
            $radiusButton.addClass('active');
        });

        map.on('draw:drawstop', function (e) {
            $radiusButton.removeClass('active');
        });

        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer,
                bbox = e.layer.getBounds().pad(0.01),
                bboxString = bbox.toBBoxString();

            map.fitBounds(bbox);
            var radiusXHR = klp.api.do('institutions/list', {'lean': true, 'bbox':bboxString, 'geometry': 'yes', 'per_page': 0});
            radiusXHR.done(function (data) {
                radiusLayer = L.geoJson(filterGeoJSON(data), {
                    pointToLayer: function(feature, latlng) {
                        if (feature.properties.type.id == "primary") {
                            return L.marker(latlng, {icon: mapIcon('primaryschool')});
                        } else {
                            return L.marker(latlng, {icon: mapIcon('preschool')});
                        }
                    },
                    onEachFeature: onEachSchool
                    });
                enabledLayers.clearLayers();
                enabledLayers.addLayer(radiusLayer);
                });
        });

    };

    t.startLoading = function() {
        t.map.spin(true, {top: '40px', 'left': '70px'});
    };

    t.stopLoading = function() {
        t.map.spin(false);
    };

    function updateLayers() {

        var currentZoom = map.getZoom();

        if (lastZoom == 8 && currentZoom < 8) {
            enabledLayers.clearLayers();
            enabledLayers.addLayer(districtLayer);
            enabledLayers.addLayer(preschoolDistrictLayer);
        }
        if ((lastZoom == 7 || lastZoom == 10) && (currentZoom == 8 || currentZoom == 9)) {
            enabledLayers.clearLayers();
            enabledLayers.addLayer(blockLayer);
            enabledLayers.addLayer(projectLayer);
        }
        if ((lastZoom == 9 || lastZoom == 12) && (currentZoom == 10 || currentZoom == 11)) {
            enabledLayers.clearLayers();
            enabledLayers.addLayer(clusterLayer);
            enabledLayers.addLayer(circleLayer);
        }
        if (lastZoom == 11 && currentZoom >= 12) {
            enabledLayers.clearLayers();
            enabledLayers.addLayer(schoolCluster);
            enabledLayers.addLayer(preschoolCluster);
        }

        lastZoom = currentZoom;
    }

    function setURL() {

        var currentZoom = map.getZoom();
        var mapCenter = map.getCenter();
        var mapURL = currentZoom+'/'+mapCenter.lat.toFixed(5)+'/'+mapCenter.lng.toFixed(5);
        klp.router.setHash(mapURL, {}, {trigger: false, replace: true});
    }


    t.closePopup = function() {
        map.closePopup();
    };

    function load_map() {

        var southWest_lat = stateLatLongs[state_code]["SW_lat"]
        var southWest_long = stateLatLongs[state_code]["SW_long"]
        var northEast_lat = stateLatLongs[state_code]["NE_lat"]
        var northEast_long = stateLatLongs[state_code]["NE_long"]
        var default_lat = stateLatLongs[state_code]["default_lat"]
        var default_long = stateLatLongs[state_code]["default_long"]
        // var southWest = L.latLng(11.57, 73.87),
        //     northEast = L.latLng(18.45, 78.57),
        var southWest = L.latLng(southWest_lat, southWest_long),
            northEast = L.latLng(northEast_lat, northEast_long),
            bounds = L.latLngBounds(southWest, northEast);

        marker_overlay_html = $("#tpl_marker_overlay").html();
        t.map = map = L.map('js-map-canvas', {maxBounds: bounds}).setView([default_lat, default_long], 14);
        L.tileLayer(klp.settings.tilesURL, {
            maxZoom: 16,
            //attribution: 'OpenStreetMap, OSM-Bright'
            attribution:'<a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox</a> <a href="https://openstreetmap.org/about/" target="_blank">© OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/#mapbox.streets/-74.500/40.000/9" target="_blank">Improve this map</a>'
        }).addTo(map);

        // Try to find users location.
        map.locate({setView: false, maxZoom: 15});
        map.on('locationfound', onLocationFound);

        function onLocationFound(e) {
            if (bounds.contains(e.latlng)) {
                map.setView(e.latlng, 15);
            }
        }

        $(document).on('click', ".js-trigger-volunteer-map", function() {
            map.closePopup();
            map_voluteer_date = false;
        });
    }

})();
