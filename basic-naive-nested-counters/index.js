import {Observable as O} from "rx"

import Counter from "../basic-counter"

const main = (T, initial = {a: 0, b: 5}) => in$ => {
  const {DOM: {h}, run, compose, extract} = T

  const aDOM$ = extract(run(in$, Counter(T)), "DOM")
  const bDOM$ = extract(run(in$, Counter(T)), "DOM")
  const vdom$ = O.combineLatest(aDOM$, bDOM$, (aDOM, bDOM) =>
    h("div", [
      aDOM,
      h("hr"),
      bDOM
    ]))
  return compose({DOM: vdom$})
}

export default main
