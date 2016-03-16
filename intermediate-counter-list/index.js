import {Observable as O} from "rx"

import Counter from "../basic-counter"


const main = (T, initial = [10, 2, 1]) => in$ => {
  const {DOM: {h, prepare, events}, run, compose, decompose, listDecomposeLatest} = T

  const [actions] = decompose(in$, "update$", "add$", "rm$")
  return intent(view(model(actions)))

  function model({update$, add$, rm$}) {
    const mods$ = O.merge(
      update$.map(values => () => values),
      add$.map(() => values => [...values, 0]),
      rm$.map(idx => values => values.filter((_, i) => i !== idx))
    )

    return mods$
      .startWith(initial)
      .scan((state, mod) => mod(state))
      .shareReplay(1)
  }

  function view(counters$) {
    const sum = arr => arr.reduce((a, b) => a + b, 0)
    const [counters, out$] = listDecomposeLatest(counters$, val => run(in$, Counter(T, val)), "DOM", "value$")

    const vdom$ = O.combineLatest(counters$, counters.DOM, (vals, counterVTrees) =>
      h("div", [
        ...counterVTrees.map((vtree, idx) =>
          h("div", [
            vtree,
            h("button.rm", {"data-idx": idx}, "Remove")
          ])),
        h("hr"),
        h("h2", `Total: ${sum(vals)}`),
        h("button.add", "Add counter")
      ]))

    return [counters$, counters.value$, prepare(vdom$), out$]
  }

  function intent([model$, childCounterValues$, vdom$, childrenOut$]) {
    const changes = s$ =>
      s$.skip(1).distinctUntilChanged()

    const add$ = events(vdom$, ".add", "click")
    const rm$ = events(vdom$, ".rm", "click").map(e => parseInt(e.target.getAttribute("data-idx")))
    const update$ = changes(childCounterValues$)

    const out$ = compose({DOM: vdom$, value$: model$}, childrenOut$)
    const action$ = compose({add$, rm$, update$})
    return [out$, action$]
  }
}

export default main
