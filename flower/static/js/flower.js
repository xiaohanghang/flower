var flower = (function () {
    "use strict";
    /*jslint browser: true */
    /*global $, WebSocket, jQuery, Rickshaw */

    function on_alert_close(event) {
        event.preventDefault();
        event.stopPropagation();
        $(event.target).parent().hide();
    }

    function show_error_alert(message) {
        $("#alert").removeClass("alert-success").addClass("alert-error");
        $("#alert-message").html("<strong>Error!</strong>    " + message);
        $("#alert").show();
    }

    function show_success_alert(message) {
        $("#alert").removeClass("alert-error").addClass("alert-success");
        $("#alert-message").html("<strong>Success!</strong>    " + message);
        $("#alert").show();
    }

    function get_selected_workers() {
        var table = $('#workers-table').DataTable();
        return $.map(table.rows('.selected').data(), function(row) {
            return row.name;
        });
    }

    function shutdown_selected(event) {
        var selected_workers = get_selected_workers();
        if (selected_workers.length == 0) {
            show_error_alert('Please select a worker');
            return;
        }

        $.each(selected_workers, function (index, worker) {
            $.ajax({
                type: 'POST',
                url: '/api/worker/shutdown/' + worker,
                dataType: 'json',
                data: { workername: worker},
                success: function (data) {
                    show_success_alert(data.message);
                },
                error: function (data) {
                    show_error_alert(data.responseText);
                }
            });
        });
    }

    function restart_selected(event) {
        var selected_workers = get_selected_workers();
        if (selected_workers.length == 0) {
            show_error_alert('Please select a worker');
            return;
        }

        $.each(selected_workers, function (index, worker) {

            $.ajax({
                type: 'POST',
                url: '/api/worker/pool/restart/' + worker,
                dataType: 'json',
                data: { workername: worker},
                success: function (data) {
                    show_success_alert(data.message);
                },
                error: function (data) {
                    show_error_alert(data.responseText);
                }
            });
        });
    }

    function refresh_selected(event) {
        var selected_workers = get_selected_workers();

        if (!selected_workers.length) {
            $.ajax({
                type: 'GET',
                url: '/api/workers',
                data: { refresh: 1 },
                success: function (data) {
                    show_success_alert('Refreshed');
                },
                error: function (data) {
                    show_error_alert(data.responseText);
                }
            });
        }

        $.each(selected_workers, function (index, worker) {
            console.log(worker);
            $.ajax({
                type: 'GET',
                url: '/api/workers',
                dataType: 'json',
                data: { workername: unescape(worker), refresh: 1 },
                success: function (data) {
                    show_success_alert(data.message || 'Refreshed');
                },
                error: function (data) {
                    show_error_alert(data.responseText);
                }
            });
        });
    }

    function on_worker_refresh(event) {
        event.preventDefault();
        event.stopPropagation();

        $.ajax({
            type: 'GET',
            url: window.location.pathname,
            data: 'refresh=1',
            success: function (data) {
                //show_success_alert('Refreshed');
                window.location.reload();
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_pool_grow(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            grow_size = $('#pool-size option:selected').html();

        $.ajax({
            type: 'POST',
            url: '/api/worker/pool/grow/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'n': grow_size,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_pool_shrink(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            shrink_size = $('#pool-size option:selected').html();

        $.ajax({
            type: 'POST',
            url: '/api/worker/pool/shrink/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'n': shrink_size,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_pool_autoscale(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            min = $('#min-autoscale').val(),
            max = $('#max-autoscale').val();

        $.ajax({
            type: 'POST',
            url: '/api/worker/pool/autoscale/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'min': min,
                'max': max,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_add_consumer(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            queue = $('#add-consumer-name').val();

        $.ajax({
            type: 'POST',
            url: '/api/worker/queue/add-consumer/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'queue': queue,
            },
            success: function (data) {
                show_success_alert(data.message);
                setTimeout(function () {
                    $('#tab-queues').load('/worker/' + workername + ' #tab-queues').fadeIn('show');
                }, 10000);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_cancel_consumer(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            queue = $(event.target).closest("tr").children("td:eq(0)").text();

        $.ajax({
            type: 'POST',
            url: '/api/worker/queue/cancel-consumer/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'queue': queue,
            },
            success: function (data) {
                show_success_alert(data.message);
                setTimeout(function () {
                    $('#tab-queues').load('/worker/' + workername + ' #tab-queues').fadeIn('show');
                }, 10000);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_task_timeout(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            taskname = $(event.target).closest("tr").children("td:eq(0)").text(),
            type = $(event.target).html().toLowerCase(),
            timeout = $(event.target).siblings().closest("input").val();

        taskname = taskname.split(' ')[0]; // removes [rate_limit=xxx]

        $.ajax({
            type: 'POST',
            url: '/api/task/timeout/' + taskname,
            dataType: 'json',
            data: {
                'workername': workername,
                'type': timeout,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_task_rate_limit(event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            taskname = $(event.target).closest("tr").children("td:eq(0)").text(),
            ratelimit = $(event.target).prev().val();

        taskname = taskname.split(' ')[0]; // removes [rate_limit=xxx]

        $.ajax({
            type: 'POST',
            url: '/api/task/rate-limit/' + taskname,
            dataType: 'json',
            data: {
                'workername': workername,
                'ratelimit': ratelimit,
            },
            success: function (data) {
                show_success_alert(data.message);
                setTimeout(function () {
                    $('#tab-limits').load('/worker/' + workername + ' #tab-limits').fadeIn('show');
                }, 10000);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_task_revoke(event) {
        event.preventDefault();
        event.stopPropagation();

        var taskid = $('#taskid').text();

        $.ajax({
            type: 'POST',
            url: '/api/task/revoke/' + taskid,
            dataType: 'json',
            data: {
                'terminate': false,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function on_task_terminate(event) {
        event.preventDefault();
        event.stopPropagation();

        var taskid = $('#taskid').text();

        $.ajax({
            type: 'POST',
            url: '/api/task/revoke/' + taskid,
            dataType: 'json',
            data: {
                'terminate': true,
            },
            success: function (data) {
                show_success_alert(data.message);
            },
            error: function (data) {
                show_error_alert(data.responseText);
            }
        });
    }

    function sum(a, b) {
        return parseInt(a) + parseInt(b);
    }

    function on_dashboard_update(update) {
        var table = $('#workers-table').DataTable();

        $.each(update, function (name, info) {
            var row = table.row('#'+name);
            if (row)
                row.data(info);
            else
                table.row.add(info);
        });
        table.draw();

        $('a#btn-active').text('Active: ' + table.column(2).data().reduce(sum, 0));
        $('a#btn-processed').text('Processed: ' + table.column(3).data().reduce(sum, 0));
        $('a#btn-failed').text('Failed: ' + table.column(4).data().reduce(sum, 0));
        $('a#btn-succeeded').text('Succeeded: ' + table.column(5).data().reduce(sum, 0));
        $('a#btn-retried').text('Retried: ' + table.column(6).data().reduce(sum, 0));
    }

    function on_cancel_task_filter(event) {
        event.preventDefault();
        event.stopPropagation();

        $('#task-filter-form').each(function () {
            $(this).find('SELECT').val('');
            $(this).find('.datetimepicker').val('');
        });

        $('#task-filter-form').submit();
    }

    function create_graph(data, id, width, height, metric) {
        id = id || '';
        width = width || 500;
        height = height || 300;
        metric = metric || '';

        var name, seriesData = [];
        for (name in data) {
            seriesData.push({name: name});
        }

        var palette = new Rickshaw.Color.Palette({scheme: 'colorwheel'});

        var graph = new Rickshaw.Graph({
            element: document.getElementById("chart" + id),
            width: width,
            height: height,
            renderer: 'stack',
            series: new Rickshaw.Series(seriesData, palette),
            maxDataPoints: 10000,
            padding: {top: 0.1, left: 0.01, right: 0.01, bottom: 0.01},
        });

        var ticksTreatment = 'glow';

        var timeUnit = new Rickshaw.Fixtures.Time.Local();
        timeUnit.formatTime = function(d) { return moment(d).format("yyyy.mm.dd HH:mm:ss"); };
        timeUnit.unit("minute");

        var xAxis = new Rickshaw.Graph.Axis.Time({
            graph: graph,
            timeFixture: new Rickshaw.Fixtures.Time.Local(),
            ticksTreatment: ticksTreatment,
            timeUnit: timeUnit
        });

        xAxis.render();

        var yAxis = new Rickshaw.Graph.Axis.Y({
            graph: graph,
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            ticksTreatment: ticksTreatment,
        });

        yAxis.render();

        var hoverDetail = new Rickshaw.Graph.HoverDetail({
            graph: graph,
            yFormatter: function(y) {
                if (y % 1 === 0)
                    return y + metric;
                else
                    return y.toFixed(2) + metric;
            }
        });

        var legend = new Rickshaw.Graph.Legend({
            graph: graph,
            element: document.getElementById('legend' + id)
        });

        var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
            graph: graph,
            legend: legend
        });

        var order = new Rickshaw.Graph.Behavior.Series.Order({
            graph: graph,
            legend: legend
        });

        var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
            graph: graph,
            legend: legend
        });

        legend.shelving = shelving;
        graph.series.legend = legend;

        graph.render();
        return graph;
    }

    function update_graph(graph, url, lastquery) {
        $.ajax({
            type: 'GET',
            url: url,
            data: {lastquery: lastquery},
            success: function (data) {
                graph.series.addData(data);
                graph.update();
            },
        });
    }

    function current_unix_time() {
        var now = new Date();
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),
                        now.getUTCDate(),  now.getUTCHours(),
                        now.getUTCMinutes(), now.getUTCSeconds())/1000;
    }

    $.urlParam = function(name){
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        return results && results[1] || 0;
    };

    $(document).ready(function () {
        if ($.inArray($(location).attr('pathname'), ['/', '/dashboard']) != -1) {
            var host = $(location).attr('host'),
                protocol = $(location).attr('protocol') == 'http:' ? 'ws://' : 'wss://',
                ws = new WebSocket(protocol + host + "/update-dashboard");
            ws.onmessage = function (event) {
                var update = $.parseJSON(event.data);
                on_dashboard_update(update);
            };
        }

        //https://github.com/twitter/bootstrap/issues/1768
        var shiftWindow = function() { scrollBy(0, -50); };
        if (location.hash) shiftWindow();
        window.addEventListener("hashchange", shiftWindow);

        // Make bootstrap tabs persistent
        $(document).ready(function () {
            if (location.hash !== '') {
                $('a[href="' + location.hash + '"]').tab('show');
            }

            $('a[data-toggle="tab"]').on('shown', function (e) {
                location.hash = $(e.target).attr('href').substr(1);
            });
        });

        if ($(location).attr('pathname') === '/monitor') {
            var sts = current_unix_time(),
                fts = current_unix_time(),
                tts = current_unix_time(),
                updateinterval = parseInt($.urlParam('updateInterval')) || 3000,
                succeeded_graph = null,
                failed_graph = null,
                time_graph = null,
                broker_graph = null;

            $.ajax({
                type: 'GET',
                url: '/monitor/succeeded-tasks',
                data: {lastquery: current_unix_time()},
                success: function (data) {
                    succeeded_graph = create_graph(data, '-succeeded');
                    succeeded_graph.update();

                    succeeded_graph.series.setTimeInterval(updateinterval);
                    setInterval(function () {
                        update_graph(succeeded_graph,
                                     '/monitor/succeeded-tasks',
                                     sts);
                        sts = current_unix_time();
                    }, updateinterval);

                },
            });

            $.ajax({
                type: 'GET',
                url: '/monitor/completion-time',
                data: {lastquery: current_unix_time()},
                success: function (data) {
                    time_graph = create_graph(data, '-time', null, null,  's');
                    time_graph.update();

                    time_graph.series.setTimeInterval(updateinterval);
                    setInterval(function () {
                        update_graph(time_graph,
                                     '/monitor/completion-time',
                                     tts);
                        tts = current_unix_time();
                    }, updateinterval);

                },
            });

            $.ajax({
                type: 'GET',
                url: '/monitor/failed-tasks',
                data: {lastquery: current_unix_time()},
                success: function (data) {
                    failed_graph = create_graph(data, '-failed');
                    failed_graph.update();

                    failed_graph.series.setTimeInterval(updateinterval);
                    setInterval(function () {
                        update_graph(failed_graph,
                                     '/monitor/failed-tasks',
                                     fts);
                        fts = current_unix_time();
                    }, updateinterval);

                },
            });

            $.ajax({
                type: 'GET',
                url: '/monitor/broker',
                success: function (data) {
                    broker_graph = create_graph(data, '-broker');
                    broker_graph.update();

                    broker_graph.series.setTimeInterval(updateinterval);
                    setInterval(function () {
                        update_graph(broker_graph,
                                     '/monitor/broker');
                    }, updateinterval);

                },
            });

        }

    });

    $(document).ready(function(){
        $('#workers-table').DataTable({
            rowId: 'name',
            searching: true,
            paginate: false,
            select: true,
            scrollX: true,
            scrollY: 500,
            scrollCollapse: true,
            order: [[ 1, "asc" ]],
            columnDefs: [
                {targets: 0,
                    data: 'name',
                    render: function (data, type, full, meta) {
                        return '<a href="/worker/' + data + '">' + data + '</a>';
                    }
                },
                {targets: 1,
                    data: 'status',
                    render: function (data, type, full, meta) {
                        if (data)
                            return '<span class="label label-success">Online</span>'
                        else
                            return '<span class="label label-important">Offline</span>'
                    }
                },
                {targets: 2, data: 'active'},
                {targets: 3, data: 'processed'},
                {targets: 4, data: 'failed'},
                {targets: 5, data: 'succeeded'},
                {targets: 6, data: 'retried'},
                {targets: 7, data: 'loadavg'},
            ],
        });

        $('#tasks-table').DataTable({
            rowId: 'uuid',
            searching: true,
            paginate: true,
            scrollX: true,
            scrollCollapse: true,
            processing: true,
            serverSide: true,
            colReorder: true,
            ajax: {
                url: '/tasks/datatable'
            },
            order: [[ 7, "asc" ]],
            oSearch: {"sSearch": $.urlParam('state') ? 'state:' + $.urlParam('state') : ''},
            columnDefs: [
                {targets: 0,
                    data: 'name',
                    render: function (data, type, full, meta) {
                        return '<a href="/task/' + data + '">' + data + '</a>';
                    }
                },
                {targets: 1,
                    data: 'uuid',
                    orderable: false,
                    render: function (data, type, full, meta) {
                        return '<a href="/task/' + data + '">' + data + '</a>';
                    }
                },
                {targets: 2,
                    data: 'state',
                    render: function (data, type, full, meta) {
                        switch (data) {
                            case 'SUCCESS':
                                return '<span class="label label-success">' + data + '</span>'
                            case 'FAILURE':
                                return '<span class="label label-important">' + data + '</span>'
                            default:
                                return '<span class="label label-default">' + data + '</span>'
                        }
                    }
                },
                {targets: 3, data: 'args'},
                {targets: 4, data: 'kwargs'},
                {targets: 5, data: 'result'},
                {targets: 6,
                    data: 'received',
                    render: function (data, type, full, meta) {
                        return data ? moment.unix(data).format() : data;
                    }

                },
                {targets: 7,
                    data: 'started',
                    render: function (data, type, full, meta) {
                        return data ? moment.unix(data).format() : data;
                    }
                },
                {targets: 8,
                    data: 'runtime',
                    render: function (data, type, full, meta) {
                        return data ? data.toFixed(3) : data;
                    }
                },
                {targets: 9, data: 'worker'},
            ],
        });

    });

    return {
        shutdown_selected: shutdown_selected,
        restart_selected: restart_selected,
        refresh_selected: refresh_selected,
        on_alert_close: on_alert_close,
        on_worker_refresh: on_worker_refresh,
        on_pool_grow: on_pool_grow,
        on_pool_shrink: on_pool_shrink,
        on_pool_autoscale: on_pool_autoscale,
        on_add_consumer: on_add_consumer,
        on_cancel_consumer: on_cancel_consumer,
        on_task_timeout: on_task_timeout,
        on_task_rate_limit: on_task_rate_limit,
        on_cancel_task_filter: on_cancel_task_filter,
        on_task_revoke: on_task_revoke,
        on_task_terminate: on_task_terminate,
    };

}(jQuery));
