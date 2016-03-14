import {Observable as O} from "rx"

const main = T => in$ => {
  const {DOM: {h, withEvents}, decompose, compose} = T

  const [actions] = decompose(in$, "Seconds")
  return intent(view(model(actions)))

  function model({Seconds: sec$}) {
    const msg$ = sec$.map(sec => "Tsers" + (sec % 2 ? "." : "!"))
    return msg$
  }

  function view(msg$) {
    const vdom$ = msg$.map(msg =>
      h("div", [
        h("h1", msg)
      ]))
    return withEvents(vdom$)
  }

  function intent(vdom$) {
    return compose({DOM: vdom$})
  }
}

export default main

/*
// How to run your application
// indexOfYourApp.js
import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import makeDOM from "@tsers/react"
import makeSeconds from "./seconds-driver"

import main from "./hello-world"


const [Transducers, signal$, execute] = TSERS({
  DOM: makeDOM("#app"),
  Seconds: makeSeconds()
})

const {run} = Transducers
execute(run(singal$, main(Transducers)))

 */
