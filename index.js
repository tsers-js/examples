import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import makeReactDOM from "@tsers/react"
import makeRouter from "./router-driver"


import hello from "./01-hello-world"


const main = T => in$ => {
  const {Router: {route}} = T

  return route(in$, "Router", {
    "/hello": playground(T, hello),
    "/*": navigation(T)
  })
}

const navigation = T => in$ => {
  const {DOM: {withEvents, events, h}, compose} = T
  return intent(view())

  function view() {
    const vdom = h("div", [
      h("h1", "Example list"),
      h("ul.examples", [
        h("li", [h("a", {href: "#hello"}, "Hello World")])
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

const playground = (T, example) => in$ => {
  const {DOM: {withEvents, events, h}, compose, run} = T
  return intent(view())

  function view() {
    const {DOM: exampleDom$, ...exampleOut} = run(in$, example(T))
    const vdom$ = exampleDom$.map(vdom =>
      h("div", [
        h("div", [h("a.back-to-examples", {href: "#"}, "Back to examples")]),
        h("div", [vdom])
      ]))

    return [withEvents(vdom$), exampleOut]
  }

  function intent([vdom$, {Router, ...out}]) {
    const route$ = events(vdom$, ".back-to-examples", "click")
      .do(e => e.preventDefault())
      .map(() => e.target.getAttribute("href"))
      .merge(Router)

    return compose({DOM: vdom$, Router: route$, ...out})
  }
}


const [T, S, E] = TSERS({
  DOM: makeReactDOM("#app"),
  Router: makeRouter()
})

E(T.loop(S, main(T)))
