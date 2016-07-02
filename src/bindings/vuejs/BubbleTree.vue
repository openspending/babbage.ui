<style>
    /* NOTE: This component style CANNOT be scoped!! */

    .bubbletree, .bubbletree .bubbletree-label2 span {
        background: #fff
    }

    .bubbletree-wrapper {
        width: 100%;
        padding-top: 60%;
        position: relative
    }

    .bubbletree {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%
    }

    .bubbletree .bubbletree-label {
        position: absolute;
        color: #fff;
        text-align: center;
        cursor: default
    }

    .bubbletree .bubbletree-amount {
        font-family: Graublau, Georgia, sans-serif;
        font-size: 16px
    }

    .bubbletree .bubbletree-desc, .bubbletree .bubbletree-label2 {
        font-size: 11px;
        font-family: sans-serif
    }

    .bubbletree .bubbletree-label2 {
        position: absolute;
        color: #000;
        text-align: center;
        cursor: default;
        margin-top: 5px
    }

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
        <strong>Too many categories.</strong> There are more than ((XXX CUTOFF)) items
        in the selected drilldown.
    </div>

    -->

    <div class="bubbletree-wrapper">
        <div id="bubbletree-{{ bubbletreeid }}"
             class="bubbletree"
        >
        </div>
    </div>

</template>

<script>

    import util from 'util'
    // Actual component below ... as an emitter object
    import BubbleTreeComponent from '../../components/bubbletree'

    export default {
        props: ['cube', 'endpoint', 'bubbletreeid', 'simulation'],
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
                // console.error("FROM_PARENT_UPDATE_BABBAGE::", util.inspect(new_initstate, {depth: 10}))
                this.state = new_initstate
                this.rebuildBubbleTree()
            }
        },
        ready () {
            // See what is in vm.$root ...
            // console.error("ROOT", util.inspect(this.$root, {depth: 10}))
            if (this.simulation) {
                console.error("TREEMAP: Simulation Mode ON")
                const endpoint = "http://next.openspending.org/api/3"
                // const cube = "boost:boost-moldova-2005-2014"
                const cube = "0638aadc448427e8b617257ad01cd38a:kpkt-propose-2016-hierarchy-test"
                const state = {
                    // Aggregates? REQUIRED!!!!
                    aggregates: "Amount.sum",
                    // Top Level
                    group: ["economic_classification_Top_x.Top_Level_x_1"]
                }

                const bubbleTree = new BubbleTreeComponent()
                const wrapper = document.querySelector("div#bubbletree-kpkt")

                // DEBUG:
                // console.error("WRAPPER: %s %s", typeof(wrapper), util.inspect(wrapper))
                bubbleTree.build(endpoint, cube, state, wrapper);
                bubbleTree.on('click', function (bubbleTreeComponent, item) {
                            this.$emit('bubbletree-click-simulation', bubbleTreeComponent, item)
                            console.error("KEY:", item.label)
                            // Simulate a drilldown happening
                            this.simulateDrillDown()

                        }.bind(this)
                )

                //$scope.cutoffWarning = false;
                // $scope.queryLoaded = true;

            } else {
                // Do nothing ...
            }
        },
        methods: {
            rebuildBubbleTree: function () {

                const bubbleTree = new BubbleTreeComponent()
                const wrapper = document.querySelector(`div#bubbletree-${this.bubbletreeid}`)

                bubbleTree.build(this.endpoint, this.cube, this.state, wrapper);
                bubbleTree.on('click', function (bubbleTreeComponent, item) {
                            // DEBUG
                            // console.error("KEY:", item.label)
                            this.$dispatch('babbage-click', item.label)
                        }.bind(this)
                )

            },
            simulateDrillDown: function () {
                const endpoint = "http://next.openspending.org/api/3"
                // const cube = "boost:boost-moldova-2005-2014"
                const cube = "0638aadc448427e8b617257ad01cd38a:kpkt-propose-2016-hierarchy-test"
                const state = {
                    // Aggregates? REQUIRED!!!!
                    aggregates: "Amount.sum",
                    // Level 1:
                    group: ["economic_classification_Level.Level_1_x_2"]
                }

                const bubbleTree = new BubbleTreeComponent()
                const wrapper = document.querySelector(`div#bubbletree-${this.bubbletreeid}`)

                bubbleTree.build(endpoint, cube, state, wrapper);
                bubbleTree.on('click', function (bubbleTreeComponent, item) {
                            console.error("IN SUBTREE!!")
                        }.bind(this)
                )
            }

        },
        computed: {}

    }

</script>