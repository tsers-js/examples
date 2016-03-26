import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import HTTP from "@tsers/http"
import Model from "@tsers/model"

import Hello from "./hello-world"
/*import Counter from "./basic-counter"
import NaiveNesting from "./basic-naive-nested-counters"
import NestedCounters from "./intermediate-nested-counters"
import CounterList from "./intermediate-counter-list"
import GithubSearch from "./intermediate-github-search"
*/
import Router from "./router"

// start app
TSERS(main, {
  HTTP: HTTP(),
  DOM: ReactDOM("#app"),
  model: Model({}),
  Router: Router()
})

function main(signals) {
  const {DOM: {h}, Router: {route}} = signals

  const navi = h("div", [
    h("h1", "Example list"),
    h("ul.examples", [
      h("li", [h("a", {href: "#/hello"}, "Hello World")]),
      //h("li", [h("a", {href: "#/counter"}, "Counter")]),
      //h("li", [h("a", {href: "#/naive-nested"}, "Naive Nested Counters")]),
      //h("li", [h("a", {href: "#/nested"}, "Nested Counters")]),
      //h("li", [h("a", {href: "#/list"}, "Dynamic Counter List")]),
      //h("li", [h("a", {href: "#/github"}, "GitHub Search")])
    ])
  ])

  return route(signals, {
    "/hello": Playground(Hello),
    //"/counter": Playground(Counter),
    //"/naive-nested": Playground(NaiveNesting),
    //"/nested": Playground(T, NestedCounters),
    //"/list": Playground(T, CounterList),
    //"/github": Playground(T, GithubSearch),
    "/*": Navigation(navi)
  })
}

function Playground(Example) {
  return signals => {
    const {DOM: {h, prepare, events}, mux, demux} = signals
    const [example, out$] = demux(Example(signals), "DOM")

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
