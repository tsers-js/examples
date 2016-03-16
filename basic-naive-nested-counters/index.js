import {Observable as O} from "rx"

import Counter from "../basic-counter"

const main = (T, initial = {a: 0, b: 5}) => in$ => {
  const {DOM: {h}, run, compose, decompose} = T

  const [a] = decompose(run(in$, Counter(T)), "DOM")
  const [b] = decompose(run(in$, Counter(T)), "DOM")
  const vdom$ = O.combineLatest(a.DOM, b.DOM, (aDOM, bDOM) =>
    h("div", [
      aDOM,
      h("hr"),
      bDOM
    ]))
  return compose({DOM: vdom$})
}

export default main
