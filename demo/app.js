const fs = require('fs')
const path = require('path')

const Vue = require('vue')
const ElementUI = require('element-ui')
const VueCompiler = require('vue-template-compiler/browser')

const neo4j = require('neo4j-driver').v1
const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "NEO$J")
)

Vue.use(ElementUI)

global.ENV = 1
global.$render = function(...paths) {
  const filepath = path.join(...paths)
  if (global.ENV) {
    const html = fs.readFileSync(`${filepath}.html`, {encoding: 'utf8'})
    const result = VueCompiler.compileToFunctions(html).render
    fs.writeFileSync(`${filepath}.html.js`, `module.exports = ${result}`)
    return result
  } else {
    return require(`${filepath}.html.js`)
  }
}

new Vue({
  el: '#app',

  data: () => ({
    name: '',
    minDuration: '0',
    minCount: '0',
    results: [],
  }),

  computed: {
    filteredResult() {
      return this.results.filter(result => result.count >= this.minCount)
    },
    filteredCount() {
      return this.filteredResult.length
    }
  },

  watch: {
    name() {
      this.query()
    },
    minDuration() {
      this.query()
    },
  },

  created() {
    global.VM = this
  },

  methods: {
    query() {
      if (!this.name || !this.minDuration.match(/^\d+$/) || !this.minCount.match(/^\d+$/)) return
      const session = driver.session()
      session.run(`
        MATCH (a:People)-[r:Belongs]-(b:Phone)-[k:Call]-(c:Phone)
        WHERE a.name = '${this.name}'
        AND ${this.minDuration} < k.duration
        RETURN distinct(c.phone_id), count(c.phone_id)
      `).then((result) => {
        this.results = result.records.map((record) => ({
          id: record._fields[0],
          count: record._fields[1].low
        })).sort((x, y) => y.count - x.count)
        session.close()
      }).catch(console.error)
    }
  },

  render: $render('app')
})