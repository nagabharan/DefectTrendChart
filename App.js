Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    items: [{
        xtype: 'container',
        itemId: 'pickerContainer'
    }, {
        xtype: 'container',
        itemId: 'dateContainer'
    }, {
        xtype: 'container',
        itemId: 'reportContainer'
    }],
    launch: function() {
        this._loadProjects();
    },

    _loadProjects: function() {
        this.down('#pickerContainer').add({
            xtype: 'rallyprojectpicker',
            fieldLabel: 'Select Project:',
            itemId: 'proj',
            labelAlign: 'right',
            width: 300,
            listeners: {
                change: function(combobox) {
                    if (this.down('#date')) {
                        Ext.ComponentQuery.query('#dateContainer')[0].remove(Ext.ComponentQuery.query('#date')[0], true);
                    }

                    this._proj = combobox.getSelectedRecord().get('_ref');
                    this._loadDatePicker();

                },
                scope: this
            }
        });
    },

    _loadDatePicker: function() {
        var minDate = new Date(new Date() - 86400000 * 90);
        this.down('#dateContainer').add({
            xtype: 'rallydatepicker',
            fieldLabel: 'Select Date:',
            itemId: 'date',
            labelAlign: 'right',
            width: 300,
            minDate: minDate,
            listeners: {
                select: function(combobox, date) {
                    if (this.down('#report')) {
                        Ext.ComponentQuery.query('#reportContainer')[0].remove(Ext.ComponentQuery.query('#myChart')[0], true);
                    }
                    this._onDateSelected(date);
                },
                scope: this
            }
        });
    },

    _onDateSelected: function(date) {
        this._date = date;
        this._defineCalculator();
        this._makeChart();
    },

    _defineCalculator: function() {
        var that = this;
        Ext.define("MyDefectCalculator", {
            extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",
            getMetrics: function() {
                var metrics = [{
                    field: "State",
                    as: "Open",
                    display: "column",
                    f: "filteredCount",
                    filterField: "State",
                    filterValues: ["Submitted", "Open"]
                }, {
                    field: "State",
                    as: "Closed",
                    display: "column",
                    f: "filteredCount",
                    filterField: "State",
                    filterValues: ["Fixed", "Closed"]
                }];
                return metrics;
            }
        });
    },

    _makeChart: function() {
        if (this.down('#myChart')) {
            this.remove('myChart');
        }
        var timePeriod = new Date(new Date() - this._date);

        var project = this.getContext().getProject().ObjectID;

        var storeConfig = this._createStoreConfig(project, timePeriod);

        this.chartConfig.calculatorConfig.startDate = this._date;
        this.chartConfig.calculatorConfig.endDate = new Date();
        this.chartConfig.storeConfig = storeConfig;
        this.down('#reportContainer').add(this.chartConfig);
    },

    _createStoreConfig: function(project, validFrom) {
        return {
            listeners: {
                load: function(store, data) {
                    console.log("data", data.length);
                }
            },
            filters: [{
                property: '_ProjectHierarchy',
                operator: 'in',
                value: [project]
            }, {
                property: '_TypeHierarchy',
                operator: 'in',
                value: ['Defect']
            }, {
                property: '_ValidFrom',
                operator: '>',
                value: validFrom
            }],
            autoLoad: true,
            limit: Infinity,
            fetch: ['State'],
            hydrate: ['State']
        };
    },

    chartConfig: {
        xtype: 'rallychart',
        itemId: 'myChart',
        chartColors: ['Red', 'Green'],

        storeConfig: {},
        calculatorType: 'MyDefectCalculator',

        calculatorConfig: {},

        chartConfig: {

            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            chart: {},
            title: {
                text: 'Open/Closed Defects'
            },
            xAxis: {
                tickInterval: 1,
                labels: {
                    formatter: function() {
                        var d = new Date(this.value);
                        return "" + (d.getMonth() + 1) + "/" + d.getDate();
                    }
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: [{
                title: {
                    text: 'Count'
                }
            }]
        }
    }

});