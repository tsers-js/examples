import {Observable as O} from "rx"

const main = T => in$ => {
  const {DOM: {h, withEvents, events}, compose, decompose} = T

  const actions = decompose(in$, "inc$", "dec$", "incAsync$", "decOdd$")
  return intent(view(model(actions)))

  function model({inc$, dec$, incAsync$, decOdd$}) {
    const anyInc$ = inc$.merge(incAsync$)
    const anyDec$ = dec$.merge(decOdd$)
    return anyInc$
      .map(() => +1)
      .merge(anyDec$.map(() => -1))
      .startWith(0)
      .scan((state, d) => state + d)
      .shareReplay(1)
  }

  function view(counter$) {
    const vdom$ = counter$.map(value => h("div", [
      h("h1", `Counter is ${value}`),
      h("p", [
        h("button.inc", "Increment"),
        h("button.dec", "Decrement"),
        h("button.inc-async", "Increment after 1 sec"),
        h("button.dec-odd", "Decrement if odd")
      ])
    ]))
    return [counter$, withEvents(vdom$)]
  }

  function intent([counter$, vdom$]) {
    const inc$ = events(vdom$, ".inc", "click")
    const dec$ = events(vdom$, ".dec", "click")
    const incAsync$ = events(vdom$, ".inc-async", "click").delay(1000)
    const decOdd$ = counter$.sample(events(vdom$, ".dec-odd", "click")).filter(val => val % 2)

    const out$ = compose({DOM: vdom$})
    const action$ = compose({inc$, dec$, incAsync$, decOdd$})
    return [out$, action$]
  }
}

export default main
