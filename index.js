import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import makeReactDOM from "@tsers/react"
import makeHTTP from "@tsers/http"

import Hello from "./basic-hello-world"
import Counter from "./basic-counter"
import NaiveNesting from "./basic-naive-nested-counters"
import NestedCounters from "./intermediate-nested-counters"
import CounterList from "./intermediate-counter-list"
import GithubSearch from "./intermediate-github-search"
import makeRouter from "./advanced-router-driver"


function makeSeconds() {
  return function secondsDriver() {
    const signals = O.interval(1000).startWith(0)
    return {signals}
  }
}

const main = T => in$ => {
  const {Router: {route}} = T

  return route(in$, "Router", {
    "/hello": Playground(T, Hello),
    "/counter": Playground(T, Counter),
    "/naive-nested": Playground(T, NaiveNesting),
    "/nested": Playground(T, NestedCounters),
    "/list": Playground(T, CounterList),
    "/github": Playground(T, GithubSearch),
    "/*": Navigation(T)
  })
}

const Navigation = T => in$ => {
  const {DOM: {prepare, events, h}, compose} = T
  return intent(view())

  function view() {
    const vdom = h("div", [
      h("h1", "Example list"),
      h("ul.examples", [
        h("li", [h("a", {href: "#/hello"}, "Hello World")]),
        h("li", [h("a", {href: "#/counter"}, "Counter")]),
        h("li", [h("a", {href: "#/naive-nested"}, "Naive Nested Counters")]),
        h("li", [h("a", {href: "#/nested"}, "Nested Counters")]),
        h("li", [h("a", {href: "#/list"}, "Dynamic Counter List")]),
        h("li", [h("a", {href: "#/github"}, "GitHub Search")])
      ])
    ])

    return prepare(O.just(vdom))
  }

  function intent(vdom$) {
    const route$ = events(vdom$, ".examples a", "click")
      .do(e => e.preventDefault())
      .map(e => e.target.getAttribute("href"))

    return compose({DOM: vdom$, Router: route$})
  }
}

const Playground = (T, Example) => in$ => {
  const {DOM: {prepare, events, h}, compose, run, decompose} = T
  return intent(view())

  function view() {
    const [example, exampleOut$] = decompose(run(in$, Example(T)), "DOM", "Router")
    const vdom$ = example.DOM.map(vdom =>
      h("div", [
        h("div", [h("a.back-to-examples", {href: "#/"}, "Back to examples")]),
        h("div", [vdom])
      ]))

    return [prepare(vdom$), example.Router, exampleOut$]
  }

  function intent([vdom$, Router, exampleOut$]) {
    const route$ = events(vdom$, ".back-to-examples", "click")
      .do(e => e.preventDefault())
      .map(e => e.target.getAttribute("href"))
      .merge(Router)

    return compose({DOM: vdom$, Router: route$}, exampleOut$)
  }
}


const [Transducers, signal$, execute] = TSERS({
  DOM: makeReactDOM("#app"),
  HTTP: makeHTTP(),
  Seconds: makeSeconds(),
  Router: makeRouter()
})
const {run} = Transducers

execute(run(signal$, main(Transducers)))
