import {Observable as O} from "rx"


export default function main({DOM, model$, mux}) {
  const {h} = DOM

  // model$ is an instance of @tsers/model - it provides the application
  // state as an observable, so you can use model$ like any other observable
  // (map, filter, combineLatest, ...).

  // let's use the model$ observable to get its value and render a virtual-dom
  // based on the value
  const vdom$ = DOM.prepare(model$.map(counter =>
    h("div", [
      h("h1", `Counter value is ${counter}`),
      h("button.inc", "++"),
      h("button.dec", "--")
    ])))

  // model$ enables you to change the state by emitting "modify functions"
  // as out output signals. The modify functions have always signature
  // (curState => nextState) - they receive the current state of the model
  // as input and must provide the next state based on the current state

  // Let's make modify functions for the counter: when increment button is
  // clicked, increment the counter state by +1. When decrement button is clicked,
  // decrement the state by -1
  const incMod$ = DOM.events(vdom$, ".inc", "click").map(() => state => state + 1)
  const decMod$ = DOM.events(vdom$, ".dec", "click").map(() => state => state - 1)

  // And because the modify are just observables, we can merge them
  const mod$ = O.merge(incMod$, decMod$)

  return mux({
    DOM: vdom$,
    // Like DOM interpreter, Model interpreter also expects that model modifications
    // are "prepared". That's why model interpreter provides a helper function .mod(mod$)
    // which converts the modify function observables to actual state modify observables
    // that do the actual state modifications
    model$: model$.mod(mod$)
  })
}


/*

// In order to run this app, you must setup a model interpreter
// for counter (with initial value):
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model from "@tsers/model"

import Counter from "./counter"

TSERS(Counter, {
  DOM: ReactDOM("#app"),
  model$: Model(0)          // initial value = 0
})

*/
