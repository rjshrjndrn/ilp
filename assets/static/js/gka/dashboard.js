/* vi:si:et:sw=4:sts=4:ts=4 */
'use strict';
var districts = {"meta":[],'details':[]};
var entity = {"meta":[],'details':[]};
var entityDetails = {};
var topSummaryData = {};

(function() {
    var premodalQueryParams = {};

    klp.init = function() {

        // Screen size adjustments
        if(screen.width >= 640) {
            $('.one-row-chart').height(400);
        } else {
            $('.one-row-chart').height(200);
        }

        // All GKA related data are stored in GKA
        klp.GKA = {};
        klp.GKA.routerParams = {};
        klp.GKA.GRAP_LABEL_MAX_CHAR = 4;

        // This function is used as a callback to accordion init function
        // to determine which section to load when a user clicks a
        // section
        klp.GKA.accordionClicked = function($el) {
            var isSectionVisible = $el.is(':visible'),
                elId = $el.attr('id'),
                functionMap = {
                    sms: loadSmsData,
                    assessment: loadAssmtData,
                    gpcontest: loadGPContestData,
                    surveys: loadSurveys,
                    comparison: loadComparison
                };

            if(!isSectionVisible) { return; }

            if(typeof(functionMap[elId]) === 'function') {
                functionMap[elId](klp.GKA.routerParams);
            } else {
                console.log('Accordion event handler returned an unknow id');
            }
        }

        // Initialize accordion, filters and router
        klp.accordion.init();
        klp.gka_filters.init();
        klp.router = new KLPRouter();
        klp.router.init();
        klp.router.events.on('hashchange', function(event, params) {
            hashChanged(params);
        });
        klp.router.start();

        $('#startDate').yearMonthSelect("init", {validYears: ['2016', '2017', '2018']});
        $('#endDate').yearMonthSelect("init", {validYears: ['2016', '2017', '2018']});

        //this is a bit of a hack to save query state when
        //triggering a modal, since modals over-ride the url
        //Works only on date modal.
        premodalQueryParams = klp.router.getHash().queryParams;
        if (premodalQueryParams.hasOwnProperty("from")) {
            var mDate = moment(premodalQueryParams.from);
            $('#startDate').yearMonthSelect("setDate", mDate);
        }
        if (premodalQueryParams.hasOwnProperty("to")) {
            var mDate = moment(premodalQueryParams.to);
            $('#endDate').yearMonthSelect("setDate", mDate);
        } else {
            $('#endDate').yearMonthSelect("setDate", moment());
        }

        $('#dateSummary').click(function(e) {
            e.preventDefault();
            var currentQueryParams = premodalQueryParams;
            var startDate = $('#startDate').yearMonthSelect("getFirstDay");
            var endDate = $('#endDate').yearMonthSelect("getLastDay");
            if (moment(startDate) > moment(endDate)) {
                klp.utils.alertMessage("End date must be after start date", "error");
                return false;
            }
            currentQueryParams['from'] = $('#startDate').yearMonthSelect("getFirstDay");
            currentQueryParams['to'] = $('#endDate').yearMonthSelect("getLastDay");
            klp.router.setHash(null, currentQueryParams);
        });

        $('a[href=#datemodal]').click(function(e) {
            premodalQueryParams = klp.router.getHash().queryParams;
        });

        $('a[href=#close]').click(function(e) {
            klp.router.setHash(null, premodalQueryParams, {'trigger': false});
        });

        $('a[href=#searchmodal]').click(function(e) {
            premodalQueryParams = klp.router.getHash().queryParams;
        });
        loadData(premodalQueryParams);
    }

    function hashChanged(params) {
        var queryParams = params.queryParams;
        //This is for the default URL localhost:8001/gka
        //No Query Params
        if(window.location.hash)
        {
            //This is a reload of localhost:8001/gka
            //No Query Params
            if(window.location.hash == '#resetButton') {
                window.location.href = '/gka';
            }
            //This is to prevent server calls when just the modal actions are called
            //This condition is triggered for eg: for localhost:8001/gka#datemodal?from=12/03/2016&to12/06/2016
            //and not for just localhost:8001/gka#datemodal
            else if(window.location.hash != '#datemodal' && window.location.hash !='#close' && window.location.hash != '#searchmodal')
            {
                loadData(queryParams, true);
            }
            //This is the do nothing case switch for localhost:8001/gka#datemodal
            else {//do nothing;
            }
        }
        $('#ReportContainer').show();
    }

    function loadData(params, reloadOpenSection) {
        // As of August 1st, 2017, data from June 2017 is shown as default
        if(!params.from && !params.to) {
            params.from = '2017-06-01';
            params.to = '2018-03-31';
        }

        klp.GKA.routerParams = params;

        loadTopSummary(params);

        if(reloadOpenSection) {
            var sections = [
                'sms',
                'assessment',
                'gpcontest',
                'surveys',
                'comparison'
            ];

            _.each(sections, function(s){
                klp.GKA.accordionClicked($('#' + s));
            });
        }
    }

    function loadComparison(params) {
        // Spinners
        $('#compareTable').startLoading();

        var $compareXHR = klp.api.do(
            "surveys/boundaryneighbour/info/?survey_tag=gka", params
        );
        $compareXHR.done(function(comparisonData) {

            var neighbours = _.map(comparisonData.results, function(c){
                var data = {
                    name: c.name,
                    schools: c.schools,
                    sms: 'NA',
                    sms_govt: 'NA',
                    sms_govt_percent: 'NA',
                    assmt: 'NA',
                    contests: 'NA',
                    surveys: 'NA'
                };

                try {
                    data.sms = c.surveys['11']['total_assessments'];
                } catch (e) {}

                try {
                    data.assmt = c.surveys['3']['total_assessments'];
                } catch (e) {}

                try {
                    data.contests = c.surveys['2']['electioncount']['GP'];
                } catch (e) {}

                try {
                    data.surveys = c.surveys['7']['total_assessments'];
                } catch (e) {}

                try {
                    data.sms_govt = c.surveys['11']['users']['CRP'];
                    data.sms_govt_percent = getPercent(
                        data.sms_govt, data.sms
                    );
                } catch (e) {

                } finally {
                    if(isNaN(data.sms_govt_percent)) {
                        data.sms_govt_percent = 'NA';
                    }
                }

                // COMEBACK
                return data;
            });
            var tplComparison= swig.compile($('#tpl-compareTable').html());
            var compareHTML = tplComparison({"neighbours":neighbours});
            $('#compareTable').html(compareHTML);
            $('#compareTable').stopLoading();
        });

        return; // No need to render comparison graphs for version 1

        // var $assessmentComparisonXHR = klp.api.do(
        //     "surveys/boundaryneighbour/detail/?survey_tag=gka&survey_ids=2&survey_ids=7", params
        // );
        // $assessmentComparisonXHR.done(function(chartComparisonData){
    
        //     renderComparisonCharts(params, chartComparisonData.results);
        // });
    }

    function renderComparisonCharts(params, chartComparisonData){

        var ekstepValues = {},
            gpSurveyId = 2,
            gpContestValues = {},
            gpLabels = [
                "Addition",
                "Subtraction",
                "Multiplication",
                "Division"
            ],
            districts = _.pluck(chartComparisonData, 'name').splice(0, 4),
            qgs = [];

        // Combine GP contest data

        // For each district, fetch question groups and combine data
        _.each(districts, function(d, districtIndex){

            // Select the district
            var district = _.find(chartComparisonData, function(c){
                    return c.name === d;
                }),
                qgs = [];

            // Select the question groups
            try {
                qgs = _.map(
                    district['surveys'][gpSurveyId]['questiongroups'],
                    function(qVal, qKey) {
                        return qKey;
                    }
                );
            } catch(e) { console.log('error building qgs', e); }
            
            // Add the keys together for each gp labels and store it in 
            // an array for each district
            gpContestValues['n' + (districtIndex + 1)] = _.map(gpLabels, function(label){
                var total = 0,
                    score = 0,
                    percent = 0;

                // Add each labels across all question groups
                _.each(qgs, function(qg){
                    var keys = district['surveys'][gpSurveyId]['questiongroups'][qg]['question_keys'];
                    
                    for(var key in keys) {
                        if(key === label) {
                            score += keys[key]['score'];
                            total += keys[key]['totol'];
                            break;
                        }
                    }
                });

                percent = getPercent(score, total);

                return {meta: d, skill: label, value: percent};

            });

        });

        // var ekstepCompetencies = {
        //     labels: labels,
        //     series: [
        //         {
        //             className: 'ct-series-f',
        //             data: ekstepValues["n1"]
        //         },
        //         {
        //             className: 'ct-series-a',
        //             data: ekstepValues["n2"]
        //         },
        //         {
        //             className: 'ct-series-g',
        //             data: ekstepValues["n3"]
        //         },
        //         {
        //             className: 'ct-series-o',
        //             data: ekstepValues["n4"]
        //         }
        //     ],
        // }

        var gpContestCompetencies = {
            labels: gpLabels,
            series: [
                {
                    className: 'ct-series-f',
                    data: gpContestValues["n1"]
                },
                {
                    className: 'ct-series-a',
                    data: gpContestValues["n2"]
                },
                {
                    className: 'ct-series-g',
                    data: gpContestValues["n3"]
                },
                {
                    className: 'ct-series-o',
                    data: gpContestValues["n4"]
                }
            ],
        }

        // renderBarChart('#compareAssmtGraph', ekstepCompetencies, "Percentage of Children");
        renderBarChart('#compareGpcGraph', gpContestCompetencies, "Percentage of Children");
    }

    function loadSmsData(params) {
        // Spinners
        $('#smsSummary').startLoading();
        $('#smsSender').startLoading();
        $('#smsVolume').startLoading();
        $('#smsQuestions').startLoading();

        var smsSurvey = getSurveyId('gka school visit');

        // Fetch SMS Summary
        var $smsSummaryXHR = klp.api.do(
            "survey/summary/?survey_tag=gka&survey_id=" + smsSurvey, params
        );
        $smsSummaryXHR.done(function(data) {;
            klp.GKA.smsSummary = data;
            renderSmsSummary(data);
            $('#smsSummary').stopLoading();
        });

        // Fetch users
        var $usersXHR = klp.api.do(
            "survey/info/users/?survey_tag=gka&survey_id=" + smsSurvey,
            params
        );
        $usersXHR.done(function(userGroups) {
            renderSMSUserCharts(userGroups.users, params);
            $('#smsSender').stopLoading();
        });

        // Fetch volumes
        var $volumesXHR = klp.api.do(
            "survey/volume/?survey_tag=gka&survey_id=" + smsSurvey,
            params
        );
        $volumesXHR.done(function(volumes) {
            var data = {
                volumes: volumes
            };
            renderSMSVolumeCharts(data, params);
            $('#smsVolume').stopLoading();
        });

        // Fetch SMS Details
        var $detailXHR = klp.api.do(
            "survey/detail/source/?survey_tag=gka&survey_id=" + smsSurvey,
            params
        );
        $detailXHR.done(function(data) {
            renderSMSDetails(data);
            $('#smsQuestions').stopLoading();
        });
    }

    function loadSurveys(params) {
        $('#surveySummary').startLoading();
        $('#mobRespondent').startLoading();
        $('#mobVolume').startLoading();
        $('#surveyQuestions').startLoading();

        var surveyId = getSurveyId('Community Survey');

        // Load the source for csv summary
        var $surveySummaryXHR = klp.api.do(
            "survey/summary/?survey_tag=gka&survey_id=" + surveyId, params
        );
        $surveySummaryXHR.done(function(surveySummaryData) {
            klp.GKA.surveySummaryData = surveySummaryData;
            renderSurveySummary(surveySummaryData);
            $('#surveySummary').stopLoading();

            // Load the respondent summary
            var $respondentXHR = klp.api.do("survey/info/respondent/?survey_tag=gka&survey_id=" + surveyId, params);
            $respondentXHR.done(function(respondentData) {
                renderRespondentChart(respondentData);
                $('#mobRespondent').stopLoading();
            });
        });

        // Load the volumes
        var $volumeXHR = klp.api.do(
            "survey/volume/?survey_tag=gka&survey_id=" + surveyId, params
        );
        $volumeXHR.done(function(data) {
            renderVolumeChart(data, params);
            $('#mobVolume').stopLoading();
        });

        // Load the detail section
        var $detailXHR = klp.api.do(
            "survey/detail/source/?survey_tag=gka&survey_id=" + surveyId, params
        );
        $detailXHR.done(function(data) {
            renderSurveyQuestions(data.source);
            $('#surveyQuestions').stopLoading();
        });
    }

    function renderVolumeChart(data, params) {
        var volumes = data;

        var $noDataAlert = $('#survey-volume-chart-no-render-alert');
        var $mobVolume = $('#mobVolume');

        $noDataAlert.hide();
        $mobVolume.show()

        if(_.isEmpty(volumes)) {
            $noDataAlert.show();
            $mobVolume.hide();
            return;
        }

        var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var fromDate = '2017-01-01';
        if(params.from) {
            fromDate = params.from;
        }

        var monthIndex = parseInt(fromDate.split('-')[1], 10),
            yearIndex = parseInt(fromDate.split('-')[0], 10),
            volumeValues = [];

        for(var i=1; i<=12; i+=1) {
            volumeValues.push(months[monthIndex] + ' ' + yearIndex);
            monthIndex += 1;
            if(monthIndex > 12) {
                monthIndex = 1;
                yearIndex += 1;
            }
        }

        var volume_values = _.map(volumeValues, function(v){
            var month = v.split(' ')[0],
                year = v.split(' ')[1];
            return {
                'meta': v,
                'value': volumes[year] ? volumes[year][month] : 0
            };
        });

        var data = {
            labels: _.map(volume_values, function(v){ return v.meta }),
            series: [
                {
                    className: 'ct-series-b',
                    data: volume_values,
                }
            ]
        }

        renderLineChart('#mobVolume', data);
    }

    function renderRespondentChart(data) {
        var labelMap = {
            'SDMC Member': 'SDMC',
            'CBO Member': 'CBO',
            'Parents': 'Parent',
            'Teachers': 'Teacher',
            'Volunteer': 'Volunteer',
            'Educated Youth': 'Youth',
            'Local Leader': 'Leader',
            'Akshara Staff': 'Akshara',
            'Elected Representative': 'Elected' ,
            'Parents': 'Parents',
            'Children': 'Children'
        };

        var labels = _.values(labelMap);

        var respondents = data.respondents;
        var meta_values = [];
        for ( var label in labelMap) {
            meta_values.push({'meta': labelMap[label], 'value': respondents[label] || 0})
        }

        var data_respondent = {
            labels: labels,
            series: [
                {
                    className: 'ct-series-a',
                    data: meta_values,
                }
            ]
        };

        renderBarChart('#mobRespondent', data_respondent);
    }

    function renderSurveyQuestions(data) {
        var questionKeys = [];
        questionKeys = [
            "mob-sdmc-meet",
            "mob-subtraction",
            "mob-addition",
            "mob-read-english",
            "mob-read-kannada",
            "mob-teacher-shortage",
            "mob-mdm-satisfactory",
            "ivrss-functional-toilets-girls"
        ];

        var combinedData = combineDataSources(
            data, ['csv', 'mobile'], questionKeys
        );

        var questionObjects = _.map(questionKeys, function(key) {
            return getQuestion(combinedData, 'combinedData', key);
        });
        var questions = getQuestionsArray(questionObjects);
        //var regroup = {}
        var tplResponses = swig.compile($('#tpl-mobResponses').html());
        // for (var each in questions)
        //     regroup[questions[each]["key"]] = questions[each];
        var html = tplResponses({"questions":questions})
        $('#surveyQuestions').html(html);
    }

    function renderSurveySummary(data) {
        var tplCsvSummary = swig.compile($('#tpl-csvSummary').html());

        data = data.summary;
        data.total_assessments = data.total_assessments ? data.total_assessments: 0;
        data["format_last_assessment"] = data.last_assessment ? formatLastStory(data.last_assessment, true): 'NA';

        var csvSummaryHTML = tplCsvSummary(data);
        $('#surveySummary').html(csvSummaryHTML);
    }


    // Renders top summary of GKA dashboard
    function loadTopSummary(params) {

        // Loading spinner
        var $spinner = $('#ReportContainer').find('.js-summary-container'),
            year = '';

        // Start the loading spinner
        $spinner.startLoading();

        // Top summary needs a year
        if(params.from && params.to) {
            year = (parseInt(params.to.slice(2, 4)) - 1) + params.to.slice(2, 4);
        }

        // Top summary doesn't need a from and to
        // delete params.from;
        // delete params.to;

        // Load the summary first
        var $summaryXHR = klp.api.do(
            "surveys/tagmappingsummary/?survey_tag=gka&year=" + year, params
        );
        $summaryXHR.done(function(tagmappingData) {
            var topSummary = {
                education_volunteers: 0,
                total_school: tagmappingData.total_schools,
                children_impacted: tagmappingData.num_students,
                schools_impacted: tagmappingData.num_schools
            };

            // Load the users Education volunteers count
            var $usersXHR = klp.api.do(
                "surveys/usercount/?survey_tag=gka", params
            );
            $usersXHR.done(function(usersCountData) {
                topSummary.active_users = usersCountData.count; 

                klp.GKA.topSummaryData = topSummary;
                renderTopSummary(topSummary);
                $spinner.stopLoading();

                /* As of 5 March 2018, rest of the sections are loaded
                    only after a user opens a section
                */
                // Load the rest of sections
                // loadSmsData(params);
                // loadAssmtData(params);
                // loadGPContestData(params);
                // loadSurveys(params);
                // loadComparison(params);
            });
        });
    }

    function renderTopSummary(topSummary) {
        var tplTopSummary = swig.compile($('#tpl-topSummary').html());
        var topSummaryHTML = tplTopSummary({"data": topSummary});
        $('#topSummary').html(topSummaryHTML);
    }

    function renderSmsSummary(data) {
        var summaryData = {},
            lastAssessment = null,
            tplSmsSummary = swig.compile($('#tpl-smsSummary').html());

        data = data.summary;
        summaryData.assessment_count = data.total_assessments ? data.total_assessments: 0;
        summaryData.schools_impacted = data.schools_impacted;
        summaryData.last_assessment = data.last_assessment;
        summaryData.format_lastsms = data.last_assessment ? formatLastStory(
            data.last_assessment, true): 'NA';
        var smsSummaryHTML = tplSmsSummary(summaryData);
        $('#smsSummary').html(smsSummaryHTML);

    }


    function renderSMSDetails(detailsData) {

        var SMSQuestionKeys = [
                "ivrss-gka-trained",
                "ivrss-math-class-happening",
                "ivrss-gka-tlm-in-use",
                "ivrss-gka-rep-stage",
                "ivrss-group-work"
            ],
            data = combineDataSources(
                detailsData.source, ['sms', 'konnectsms'], SMSQuestionKeys
            ),
            questionObjects = _.map(SMSQuestionKeys, function(key) {
                return getQuestion(data, 'combinedData', key);
            }),
            questions = getQuestionsArray(questionObjects),
            regroup = {},
            tplResponses = swig.compile($('#tpl-smsResponses').html());
        
        for (var each in questions) {
            regroup[questions[each]["key"]] = questions[each];
        }

        // Add default values to prevent JS errors at the template lebel
        _.each(SMSQuestionKeys, function(qKey){
            if(!regroup[qKey]) {
                regroup[qKey] = {
                    percent: "0",
                    score: 0,
                    total: 0
                };
            }
        });

        $('#smsQuestions').html(tplResponses({"questions":regroup}));
    }


    function renderSMSUserCharts(users, params) {
        var meta_values = [],
            labels = [],
            userFullName = {
                PR:"Parents",
                CH:"Children",
                TR:"Teachers",
                VR:"Volunteer",
                CM:"CBO Member",
                HM:"Head Master",
                SM:"SDMC Member",
                LL:"Local Leader",
                AS:"Akshara Staff",
                EY:"Educated Youth",
                EO:"Educational Officer",
                ER:"Elected Representative",
                GO:"Government Official",
                CRP:"Cluster Resource Person",
                SSA:"SSA Official",
                BRP:"Block Resource Person",
                ECO:"Educational Coordinator",
                DIET:"DIET Principal",
                BEO:"Block Education Officer",
                DDPI:"DDPI",
                DEO:"District Education Officer",
                DPC:"District Project Coordinator",
                BRC:"Block Resource Coordinator",
                CRCC:"Cluster Resource Coordinator",
                PC:"Pedagogy Coordinator",
                UK:"Unknown",
                "null":"Unknown"
            };

        for (var m in users) {
            if(m) {
                meta_values.push({
                    meta: userFullName[m] ? userFullName[m]: m,
                    value: users[m]
                });
                labels.push(m);
            }
        }

        // Build data for bar chart and render it
        var sms_sender = {
            labels: labels,
            series: [
                {
                    className: 'ct-series-b',
                    data: meta_values,
                }
            ],
        }
        renderBarChart('#smsSender', sms_sender);
    }


    function renderSMSVolumeCharts(data, params)  {

        var volumes = data.volumes;

        // Utility function for preparing volumes
        function prepareVolumes(year) {
            var values = [];

            for(var v in data.volumes[year]) {
                values.push({
                    meta: v + ' ' + year,
                    value: data.volumes[year][v]
                });
            }
            return values;
        }

        // Build the data for line chart and render it
        var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var fromDate = '2017-06-01';
        if(params.from) {
            fromDate = params.from;
        }

        var monthIndex = parseInt(fromDate.split('-')[1], 10),
            yearIndex = parseInt(fromDate.split('-')[0], 10),
            volumeValues = [];

        for(var i=1; i<=12; i+=1) {
            volumeValues.push(months[monthIndex] + ' ' + yearIndex);
            monthIndex += 1;
            if(monthIndex > 12) {
                monthIndex = 1;
                yearIndex += 1;
            }
        }

        var volume_values = _.map(volumeValues, function(v){
            var month = v.split(' ')[0],
                year = v.split(' ')[1];

            return {
                'meta': v,
                'value': volumes[year] ? volumes[year][month] : 0
            };
        });

        var sms_volume = {
            labels: _.map(volume_values, function(v){ return v.meta }),
            series: [
                {
                    className: 'ct-series-b',
                    data: volume_values,
                }
            ]
        }

        var chartLabel = '';
        sms_volume.series = [sms_volume.series[0]];
        chartLabel = "<div class='center-text font-small uppercase'>" +
                        "<span class='fa fa-circle brand-green'></span> Actual Volumes</div>";

        renderLineChart('#smsVolume', sms_volume);
        $('#smsLegend').html(chartLabel);
    }

    function loadAssmtData(params) {
        // Spinners
        $('#assmtSummary').startLoading();
        $('#assmtVolume').startLoading();
        $('#assmtCompetancy').startLoading();

        var assessmentId = getSurveyId('Ganitha Kalika Andolana');
        
        // Load summary first
        var $summaryXHR = klp.api.do("survey/summary/?survey_id=" + assessmentId, params);
        $summaryXHR.done(function(summaryData) {
            summaryData = summaryData.summary;

            // Load details next
            var $keyXHR = klp.api.do("survey/detail/key/?survey_id=" + assessmentId, params);
            $keyXHR.done(function(detailKeydata) {

                var topSummary = klp.GKA.topSummaryData;
                var tot_gka_schools = topSummary.schools_impacted;
                var schools_assessed = summaryData.schools_impacted;
                var schools_perc = getPercent(
                    schools_assessed, tot_gka_schools
                );
                var children = summaryData.children_impacted;
                var children_impacted = topSummary.children_impacted;
                var children_perc = getPercent(children, children_impacted);
                var last_assmt = summaryData.last_assessment;
                var dataSummary = {
                    "count": summaryData.total_assessments ? summaryData.total_assessments: 0,
                    "schools": schools_assessed,
                    "schools_perc": schools_perc,
                    "children": children ? children: 0,
                    "children_perc": children_perc,
                    "last_assmt": last_assmt ?  formatLastStory(last_assmt, true) : 'NA'
                }
                renderAssmtSummary(dataSummary);
                renderAssmtCharts(detailKeydata);
                $('#assmtSummary').stopLoading();
                $('#assmtCompetancy').stopLoading();

            });

            var $volumeXHR = klp.api.do("survey/volume/?survey_id=" + assessmentId, params);
            $volumeXHR.done(function(data) {
                renderAssmtVolumeChart(data, params);
                $('#assmtVolume').stopLoading();
            });
        });
    }

    function renderAssmtSummary(data) {
        var tplAssmtSummary = swig.compile($('#tpl-assmtSummary').html());
        var assmtSummaryHTML = tplAssmtSummary({'assmt':data});
        $('#assmtSummary').html(assmtSummaryHTML);
        var tplAssmtCoverage = swig.compile($('#tpl-assmtCoverage').html());
        var assmtCoverageHTML = tplAssmtCoverage({'assmt':data});
        $('#assmtCoverage').html(assmtCoverageHTML);

    }

    function renderAssmtCharts(data) {

        function getAssmtPerc(scores, topic) {
            if (scores[topic]) {
              return getPercent(scores[topic].score, scores[topic].total)
            } else {
              return getPercent(0, 0)
            }
        }

        var scores = data.scores;

        const labels = Object.keys(data.scores);
        var meta_values = _.map(labels, (label) => {
          return {
            meta: label,
            value: getAssmtPerc(scores, label)
          }
        })

        var competencies = {
            labels: labels,
            series: [
                {
                    className: 'ct-series-i',
                    data: meta_values,
                    //distributed_series:true
                }
            ],
        }
        renderBarChart('#assmtCompetancy', competencies, "Percentage of Children");
    }

    function renderAssmtVolumeChart(volumes, params) {

        var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var fromDate = '2017-01-01';
        if(params.from) {
            fromDate = params.from;
        }
        var monthIndex = parseInt(fromDate.split('-')[1], 10),
            yearIndex = parseInt(fromDate.split('-')[0], 10),
            volumeValues = [];

        for(var i=1; i<=12; i+=1) {
            volumeValues.push(months[monthIndex] + ' ' + yearIndex);
            monthIndex += 1;
            if(monthIndex > 12) {
                monthIndex = 1;
                yearIndex += 1;
            }
        }

        var volume_values = _.map(volumeValues, function(v){
            var month = v.split(' ')[0],
                year = v.split(' ')[1];
            return {
                'meta': v,
                'value': volumes[year] ? volumes[year][month] : 0
            };
        });

        var assmt_volume = {
            labels: _.map(volume_values, function(v){return v.meta}),
            series: [
                {
                    className: 'ct-series-g',
                    data: volume_values,
                }
            ]
        }

        var chartLabel = "<div class='center-text font-small uppercase'>" +
            "<span class='fa fa-circle pink-salmon'></span> Actual Volumes</div>";

        renderLineChart('#assmtVolume', assmt_volume);
        $('#avLegend').html(chartLabel);

    }

    function loadGPContestData(params){
        $('#gpcSummary').startLoading();
        $('#gpcGender_class4').startLoading();
        $('#gpcGender_class5').startLoading();
        $('#gpcGender_class6').startLoading();

        var gpContestId = getSurveyId('GP Contest');

        var $summaryXHR = klp.api.do("api/v1/survey/summary/?survey_id=" + gpContestId, params);
        $summaryXHR.done(function(summaryData) {

            var $gpXHR = klp.api.do("survey/detail/electionboundary/?survey_id=" + gpContestId, params);
            $gpXHR.done(function(gpData) {

                var dataSummary = {
                    "schools":summaryData.summary.schools_impacted,
                    "gps": gpData.GP,
                    "children": summaryData.summary.children_impacted
                };

                // Add default values
                for(var dS in dataSummary) {
                    if(!dataSummary[dS]) {dataSummary[dS] = 0;}
                }

                var tplSummary = swig.compile($('#tpl-gpcSummary').html());
                var summaryHTML = tplSummary({"data": dataSummary});
                $('#gpcSummary').html(summaryHTML);
                $('#gpcSummary').stopLoading();
            });
        });

        var $genderXHR = klp.api.do("survey/info/class/gender/?survey_id=" + gpContestId, params);
        $genderXHR.done(function(genderData) {

            var genderSummary = {};

            try {
                genderSummary["Class 4"] = {
                    "boy_perc": getPercent(
                        genderData['Class 4 Assessment'].gender.Male.perfect_score_count,
                        genderData['Class 4 Assessment'].gender.Male.total_count
                    ),
                    "girl_perc": getPercent(
                        genderData['Class 4 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 4 Assessment'].gender.Female.total_count
                    ),
                    "total_studs": getPercent(
                        genderData['Class 4 Assessment'].gender.Male.perfect_score_count + genderData['Class 4 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 4 Assessment'].gender.Male.total_count + genderData['Class 4 Assessment'].gender.Female.total_count
                    )
                };
            } catch(e) {
                genderSummary["Class 4"] = {
                    "boy_perc": "NA",
                    "girl_perc": "NA",
                    "total_studs": "NA"
                };
            }

            try {
                genderSummary["Class 5"] = {
                    "boy_perc": getPercent(
                        genderData['Class 5 Assessment'].gender.Male.perfect_score_count,
                        genderData['Class 5 Assessment'].gender.Male.total_count
                    ),
                    "girl_perc": getPercent(
                        genderData['Class 5 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 5 Assessment'].gender.Female.total_count
                    ),
                    "total_studs": getPercent(
                        genderData['Class 5 Assessment'].gender.Male.perfect_score_count + genderData['Class 5 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 5 Assessment'].gender.Male.total_count + genderData['Class 5 Assessment'].gender.Female.total_count
                    )
                };
            } catch(e) {
                genderSummary["Class 5"] = {
                    "boy_perc": "NA",
                    "girl_perc": "NA",
                    "total_studs": "NA"
                };
            }

            try {
                genderSummary["Class 6"] = {
                    "boy_perc": getPercent(
                        genderData['Class 6 Assessment'].gender.Male.perfect_score_count,
                        genderData['Class 6 Assessment'].gender.Male.total_count
                    ),
                    "girl_perc": getPercent(
                        genderData['Class 6 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 6 Assessment'].gender.Female.total_count
                    ),
                    "total_studs": getPercent(
                        genderData['Class 6 Assessment'].gender.Male.perfect_score_count + genderData['Class 6 Assessment'].gender.Female.perfect_score_count,
                        genderData['Class 6 Assessment'].gender.Male.total_count + genderData['Class 6 Assessment'].gender.Female.total_count
                    )
                };
            } catch(e) {
                genderSummary["Class 6"] = {
                    "boy_perc": "NA",
                    "girl_perc": "NA",
                    "total_studs": "NA"
                };
            }

            var tplSummary = swig.compile($('#tpl-genderGpcSummary').html());
            var summaryHTML = tplSummary({"data": genderSummary["Class 4"]});
            $('#gpcGender_class4').html(summaryHTML);

            tplSummary = swig.compile($('#tpl-genderGpcSummary').html());
            summaryHTML = tplSummary({"data": genderSummary["Class 5"]});
            $('#gpcGender_class5').html(summaryHTML);

            tplSummary = swig.compile($('#tpl-genderGpcSummary').html());
            summaryHTML = tplSummary({"data": genderSummary["Class 6"]});
            $('#gpcGender_class6').html(summaryHTML);

            $('#gpcGender_class4').stopLoading();
            $('#gpcGender_class5').stopLoading();
            $('#gpcGender_class6').stopLoading();

        });

        var $questionGroupXHR = klp.api.do("api/v1/survey/detail/questiongroup/key/?survey_id=" + gpContestId, params);
        $questionGroupXHR.done(function(questiongroupData) {
            renderGPContestCharts(questiongroupData);
        });

    }


    function renderGPContestCharts(data) {

        function genCompetancyChartObj(classData) {
            var result = {
                labels: Object.keys(classData),
                series: [
                    {
                        className: 'ct-series-n',
                        data: []
                    }
                ]
            };

            for(var c in classData) {
                var total = classData[c].total,
                    score = classData[c].score,
                    item = {
                        meta: c,
                        value: getPercent(score, total)
                    };
                result.series[0].data.push(item);
            }
            return result;
        }


        var class4competancies = [];
        try {
            class4competancies = genCompetancyChartObj(data['Class 4 Assessment']);
        } catch(e) {}

        var class5competancies = [];
        try {
            class5competancies = genCompetancyChartObj(data['Class 5 Assessment']);
        } catch(e) {}

        var class6competancies = [];
        try {
            class6competancies = genCompetancyChartObj(data['Class 6 Assessment']);
        } catch(e) {}

        renderBarChart('#gpcGraph_class4', class4competancies, "Percentage of Children");
        renderBarChart('#gpcGraph_class5', class5competancies, "Percentage of Children");
        renderBarChart('#gpcGraph_class6', class6competancies, "Percentage of Children");
    }

    function OBSgenCompetancyChartObj(aggCompetancies) {
        function getTopicPerc(competancy){
            var yesVal = competancy['Yes'], noVal = competancy['No']
            return getPercent(yesVal, yesVal+noVal)
        }
        var meta_values = [
            {"meta":"Number Concepts", "value": getTopicPerc(aggCompetancies['Number concept'])},
            {"meta":"Addition","value": getTopicPerc(aggCompetancies['Addition'])},
            {"meta":"Subtraction","value": getTopicPerc(aggCompetancies['Subtraction'])},
            {"meta":"Multiplication","value": getTopicPerc(aggCompetancies['Multiplication'])},
            {"meta":"Division","value": getTopicPerc(aggCompetancies['Division'])},
            {"meta":"Patterns","value": getTopicPerc(aggCompetancies['Patterns'])},
            {"meta":"Shapes and Spatial Understanding","value":getTopicPerc(aggCompetancies['Shapes'])},
            {"meta":"Fractions","value": getTopicPerc(aggCompetancies['Fractions'])},
            {"meta":"Decimal","value": getTopicPerc(aggCompetancies['Decimal'])},
            {"meta":"Measurement - weight and time","value":getTopicPerc(aggCompetancies['Measurement'])}
        ];
        var competencies = {
            labels: ["Number Concepts","Addition","Subtraction","Multiplication","Division","Patterns","Shapes","Fractions","Decimal","Measurement"],
            series: [
                {
                    className: 'ct-series-n',
                    data: meta_values,
                    //distributed_series:true
                }
            ]
        }
        return competencies
    }

    function renderBarChart(elementId, data, yTitle=' ') {

        var options = {
            seriesBarDistance: 10,
            axisX: {
                showGrid: true,
                offset: 80
            },
            axisY: {
                showGrid: true,
                // offset: 80
            },
            position: 'start',
            plugins: [
                Chartist.plugins.tooltip(),
                Chartist.plugins.ctAxisTitle({
                  axisX: {
                    //No label
                  },
                  axisY: {
                    axisTitle: yTitle,
                    axisClass: 'ct-axis-title',
                    offset: {
                      x: 0,
                      y: 0
                    },
                    textAnchor: 'middle',
                    flipTitle: false
                  }
                })
            ]
        };

        var responsiveOptions = [
            ['screen and (max-width: 749px)', {
                seriesBarDistance: 5,
                height: '200px',
                axisX: {
                  labelInterpolationFnc: function (value) {
                    if (value.length > klp.GKA.GRAP_LABEL_MAX_CHAR) {
                      return value.slice(0, klp.GKA.GRAP_LABEL_MAX_CHAR) + '..'
                    }

                    return value;
                  },
                  offset: 80
                }
            }]
        ];

        var $chart_element = Chartist.Bar(elementId, data, options, responsiveOptions).on('draw', function(chartData) {
            if (chartData.type === 'bar') {
                chartData.element.attr({
                    style: 'stroke-width: 15px;'
                });
            }
            if (chartData.type === 'label' && chartData.axis === 'x') {
                chartData.element.attr({
                    width: 200
                })
            }
        });
    }

    function renderLineChart(elementId, data) {

        var options = {
            seriesBarDistance: 10,
            position: 'start',
            axisX: {
                showGrid: true,
                labelOffset: {
                    x: -20,
                    y: 0
                },
            },
            axisY: {
                showGrid: true,
            },
            plugins: [
                Chartist.plugins.tooltip()
            ]
        };

        var responsiveOptions = [
            ['screen and (max-width: 749px)', {
                seriesBarDistance: 5,
                height: '200px',
                axisX: {
                  labelInterpolationFnc: function (value) {
                    if (value.length > klp.GKA.GRAP_LABEL_MAX_CHAR-1) {
                      return value.slice(0, klp.GKA.GRAP_LABEL_MAX_CHAR-1) + '..'
                    }

                    return value;
                  },
                  offset: 80,
                }
            }]
        ];

        var $chart_element = Chartist.Line(elementId, data, options, responsiveOptions).on('draw', function(data) {
            if (data.type === 'label' && data.axis === 'x') {
                data.element.attr({
                    width: 200
                })
            }
        });
    }



    /*
        Helper functions
            TODO: move to separate file and document.
     */

    function getYear(dateString) {
        return dateString.split("-")[0];
    }

    $.fn.startLoading = function() {
        var $this = $(this);
        var $loading = $('<div />').addClass('fa fa-cog fa-spin loading-icon-base js-loading');
        $this.empty().append($loading);
    }

    $.fn.stopLoading = function() {
        var $this = $(this);
        $this.find('.js-loading').remove();
    }

    function formatLastStory(last_story, noDate) {
        var date =' ';
        var time = ' ';
        if(last_story != null) {
            if(last_story.indexOf('T') != -1) {
                var arr = last_story.split('T');
                date = moment(arr[0], "YYYY-MM-DD").format("DD MMM YYYY");
                time += moment(arr[1], "HH:mm:ss").format("h:mm:ss a");
            } else {
                date = moment(last_story, "YYYY-MM-DD").format("DD MMM YYYY");
            }
        }

        if(noDate) { return date; } else { return date + time; }
    }

    function getScore(answers, option) {
        if (!answers) { return 0; }
        option = option ? option: 'Yes';
        var score = answers[option] ? answers[option]: 0;
        return score;
    }

    function getTotal(answers) {
        if (!answers) { return 0; }
        var yes = answers['Yes'] ? answers['Yes'] : 0;
        var no = answers['No'] ? answers['No'] : 0;
        return yes + no;
    }

    function getPercent(score, total) {
        if (total == 0 || score == 0) {
            return 0;
        }
        return parseFloat((score / total) * 100).toFixed(2);
    }

    function getQuestion(data, source, key) {
        for (var i=0, len=data[source].length; i<len; i++) {
            var question = data[source][i];
            if (question.question.key === key) {
                return question;
            }
        }
        return false;
    }

    function getQuestionsArray(questions) {
        return _.map(questions, function(question, seq) {
            var score = getScore(question.answers, 'Yes');
            var total = getTotal(question.answers);
            var percent = getPercent(score, total);
            var questionObj = question.question;
            return {
                'question': questionObj? questionObj.display_text: '',
                'key': questionObj? questionObj.key: '',
                'score': score,
                'total': total,
                'percent': percent
            };
        });
    }


    function getSurveyId(name) {
        var survey = _.find(GKA_SURVEYS.surveys, function(s){ return s.name.toLowerCase() === name.toLowerCase(); });

        if(survey) {
            return survey.id;
        } else {
            return 'None';
        }
    }


    function combineDataSources(sourceData, sources, keys) {
        var s1 = sources[0],
            s2 = sources[1];


        var combined = _.map(keys, function(k){

            var s1Data = _.find(sourceData[s1], function(d){
                return d.question.key === k;
            });

            var s2Data = _.find(sourceData[s2], function(d){
                return d.question.key === k;
            });

            var answers = {Yes: 0, No: 0};
            if(s1Data) {
                answers.Yes += s1Data.answers.Yes;
                answers.No += s1Data.answers.No;
            }
            if(s2Data) {
                answers.Yes += s2Data.answers.Yes;
                answers.No += s2Data.answers.No;
            }

            if (s1Data || s2Data) {
                return {
                    answers: answers,
                    question: (s1Data && s1Data.question) ? s1Data.question : s2Data.question
                }
            } else {
                return {answers:{}, question: {}};
            }

        });

        return {combinedData: combined};
    }


})();
