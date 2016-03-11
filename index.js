import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import makeReactDOM from "@tsers/react"
import makeRouter from "./router-driver"


import Hello from "./01-hello-world"
import Counter from "./02-counter"
import NestedCounters from "./03-nested-counters"


const main = T => in$ => {
  const {Router: {route}} = T

  return route(in$, "Router", {
    "/hello": Playground(T, Hello),
    "/counter": Playground(T, Counter),
    "/counters": Playground(T, NestedCounters),
    "/*": Navigation(T)
  })
}

const Navigation = T => in$ => {
  const {DOM: {withEvents, events, h}, compose} = T
  return intent(view())

  function view() {
    const vdom = h("div", [
      h("h1", "Example list"),
      h("ul.examples", [
        h("li", [h("a", {href: "#hello"}, "Hello World")]),
        h("li", [h("a", {href: "#counter"}, "Counter")]),
        h("li", [h("a", {href: "#counters"}, "Nested Counters")])
      ])
    ])

    return withEvents(O.just(vdom))
  }

  function intent(vdom$) {
    const route$ = events(vdom$, ".examples a", "click")
      .do(e => e.preventDefault())
      .map(e => e.target.getAttribute("href"))

    return compose({DOM: vdom$, Router: route$})
  }
}

const Playground = (T, Example) => in$ => {
  const {DOM: {withEvents, events, h}, compose, run, decompose} = T
  return intent(view())

  function view() {
    const [example, exampleOut$] = decompose(run(in$, Example(T)), "DOM", "Router")
    const vdom$ = example.DOM.map(vdom =>
      h("div", [
        h("div", [h("a.back-to-examples", {href: "#/"}, "Back to examples")]),
        h("div", [vdom])
      ]))

    return [withEvents(vdom$), example.Router, exampleOut$]
  }

  function intent([vdom$, Router, exampleOut$]) {
    const route$ = events(vdom$, ".back-to-examples", "click")
      .do(e => e.preventDefault())
      .map(e => "")
      .merge(Router)

    return compose({DOM: vdom$, Router: route$}, exampleOut$)
  }
}


const [T, signal$, execute] = TSERS({
  DOM: makeReactDOM("#app"),
  Router: makeRouter()
})
const {run} = T

execute(run(signal$, main(T)))
