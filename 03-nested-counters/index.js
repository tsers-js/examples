import {Observable as O} from "rx"

import Counter from "../02-counter"


const main = (T, initial = {a: 0, b: 5}) => in$ => {
  const {DOM: {h, withEvents, events}, run, compose, decompose} = T

  const actions = decompose(in$, "updateA$", "updateB$")
  return intent(view(model(actions)))

  function model({updateA$, updateB$}) {
    const mods$ = O.merge(
      updateA$.map(val => state => ({...state, a: val})),
      updateB$.map(val => state => ({...state, b: val}))
    )

    return mods$
      .startWith(initial)
      .scan((state, mod) => mod(state))
      .shareReplay(1)
  }

  function view(model$) {
    const viewOut$ = model$.flatMapLatest(({a, b}) => {
      const {DOM: aDOM$, value$: a$, ...aOut} = run(in$, Counter(T, a), "value$")
      const {DOM: bDOM$, value$: b$, ...bOut} = run(in$, Counter(T, b), "value$")
      const vdom$ = O.combineLatest(aDOM$, bDOM$, (aDOM, bDOM) =>
        h("div", [
          aDOM,
          bDOM,
          h("hr"),
          h("h2", `Total: ${a + b}`),
          h("button.reset", "Reset all")
        ]))

      return compose({DOM: withEvents(vdom$), a$, b$})
        .merge(compose(aOut))
        .merge(compose(bOut))
    })

    return [model$, decompose(viewOut$.share(), "a$", "b$")]
  }

  function intent([model$, {DOM: vdom$, a$, b$, ...out}]) {
    const changes = s$ =>
      s$.skip(1).distinctUntilChanged()

    const reset$ = events(vdom$, ".reset", "click").map(() => 0).share()
    const updateA$ = changes(a$).merge(reset$)
    const updateB$ = changes(b$).merge(reset$)

    const out$ = compose({...out, DOM: vdom$, value$: model$})
    const action$ = compose({updateA$, updateB$})
    return [ out$, action$ ]
  }
}

export default main
