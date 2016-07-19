<style>

</style>

<template>

    <!--
    <div class="alert-babbage">
        <div class="alert alert-info">
            <strong>You have not selected any data.</strong> Please choose the
            configuration for your chart.
        </div>
    </div>

    <div class="alert alert-warning">
        <strong>Too many categories.</strong> There are more than (( XXX CUTOFF )) items
        in the selected drilldown.
    </div>
    -->

    <div id="pie-{{ pieid }}" class="pie-chart"></div>

</template>

<script>

    import util from 'util'
    // Below is the actual component
    import PieChartComponent from '../../components/pie'

    export default {
        props: ['cube', 'endpoint', 'pieid', 'simulation'],
        components: {},
        data () {
            return {
                state: {
                    aggregates: null,
                    group: null,
                    filter: null
                }
            }
        },
        watch: {},
        events: {
            'update-babbage': function (new_initstate) {
                // DEBUG:
                // console.error("FROM_PARENT_UPDATE_BABBAGE::")
                this.state = new_initstate
                this.rebuildPieChart()
            }

        },
        ready () {
            // Pie Component has NO simulation mode!!
        },
        methods: {
            rebuildPieChart: function () {
                const pieChart = new PieChartComponent()
                const wrapper = document.querySelector(`div#pie-${this.pieid}`)

                pieChart.build(this.endpoint, this.cube, this.state, wrapper)
                pieChart.on('click', function (PieChartComponent, item) {
                            // DEBUG:
                            // console.error("EL:", util.inspect(item.id, {depth: 10}))
                            // item has a whole bunch of stuff; make sure you pass on only the key!!
                            this.$dispatch('babbage-click', item.id)
                        }.bind(this)
                )

            }
        },
        computed: {}

    }

</script>