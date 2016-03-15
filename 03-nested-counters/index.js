import {Observable as O} from "rx"

import Counter from "../02-counter"


const main = (T, initial = {a: 0, b: 5}) => in$ => {
  const {DOM: {h, prepare, events}, run, compose, decompose, lift} = T

  const [actions] = decompose(in$, "updateA$", "updateB$")
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
    const [a, aOut$] = lift(model$.map(m => run(in$, Counter(T, m.a))), "DOM", "value$")
    const [b, bOut$] = lift(model$.map(m => run(in$, Counter(T, m.b))), "DOM", "value$")

    const vdom$ = O.combineLatest(model$, a.DOM, b.DOM, ({a, b}, aDOM, bDOM) =>
      h("div", [
        aDOM,
        bDOM,
        h("hr"),
        h("h2", `Total: ${a + b}`),
        h("button.reset", "Reset all")
      ]))

    return [model$, a.value$, b.value$, prepare(vdom$), O.merge(aOut$, bOut$)]
  }

  function intent([model$, a$, b$, vdom$, childrenOut$]) {
    const changes = s$ =>
      s$.skip(1).distinctUntilChanged()

    const reset$ = events(vdom$, ".reset", "click").map(() => 0).share()
    const updateA$ = changes(a$).merge(reset$)
    const updateB$ = changes(b$).merge(reset$)

    const out$ = compose({DOM: vdom$, value$: model$}, childrenOut$)
    const action$ = compose({updateA$, updateB$})
    return [out$, action$]
  }
}

export default main
