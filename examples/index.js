import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import HTTP from "@tsers/http"
import Model from "@tsers/model"

import Hello from "./hello-world"
import Counter from "./counter"
import Nested from "./nested-counters"
import List, {nextId} from "./counter-list"
import GithubSearch from "./github-search"
import BMI from "./bmi-counter"
import Undoable from "./undoable-counters"
import Router from "./router"

// start app
TSERS(main, {
  HTTP: HTTP(),
  DOM: ReactDOM("#app"),
  Router: Router(),

  // set sensible initial values for the examples
  model$: Model({
    counter: 0,
    nested: {a: 0, b: 0},
    list: [
      {id: nextId(), value: 0},
      {id: nextId(), value: 0}
    ],
    github: {
      text: "",
      repositories: []
    },
    undoable: [
      {id: nextId(), value: 0}
    ]
  }, {logging: true})
})

function main(signals) {
  const {DOM: {h}, Router: {route}} = signals

  const navi = h("div", [
    h("h1", "Example list"),
    h("ul.examples", [
      h("li", [h("a", {href: "#/hello"}, "Hello World")]),
      h("li", [h("a", {href: "#/counter"}, "Counter")]),
      h("li", [h("a", {href: "#/nested"}, "Nested Counters")]),
      h("li", [h("a", {href: "#/list"}, "Counter List")]),
      h("li", [h("a", {href: "#/github"}, "GitHub Search")]),
      h("li", [h("a", {href: "#/bmi"}, "BMI Counter")]),
      h("li", [h("a", {href: "#/undoable"}, "Undoable Counters")])
    ])
  ])

  return route(signals, {
    "/hello": Playground(Hello),
    "/counter": Playground(Counter, "counter"),
    "/nested": Playground(Nested, "nested"),
    "/list": Playground(List, "list"),
    "/github": Playground(GithubSearch, "github"),
    "/bmi": Playground(BMI, "bmi"),
    "/undoable": Playground(Undoable, "undoable"),
    "/*": Navigation(navi)
  })
}

function Playground(Example, modelKey = "none") {
  return signals => {
    const {DOM: {h, prepare, events}, mux, demux} = signals
    const [example, out$] = demux(Example({
      ...signals,
      model$: signals.model$.lens(modelKey)
    }), "DOM")

    const vdom$ = prepare(example.DOM.map(vdom =>
      h("div", [
        h("div", [h("a.back-to-examples", {href: "#/"}, "Back to examples")]),
        h("div", [vdom])
      ])))

    const route$ = events(vdom$, ".back-to-examples", "click")
      .do(e => e.preventDefault())
      .map(e => e.target.getAttribute("href"))

    return mux({
      DOM: vdom$,
      Router: route$
    }, out$)
  }
}

function Navigation(vdom) {
  return ({DOM, mux}) => {
    const vdom$ = DOM.prepare(O.just(vdom))
    const route$ = DOM.events(vdom$, ".examples a", "click")
      .do(e => e.preventDefault())
      .map(e => e.target.getAttribute("href"))

    return mux({
      DOM: vdom$,
      Router: route$
    })
  }
}
