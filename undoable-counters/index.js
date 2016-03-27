import {Observable as O} from "rx"

import CounterList from "../counter-list"
import undoable from "./undoable"


export default function main(signals) {
  const {DOM, model$, demux, mux} = signals
  const {h} = DOM
  const {value$: counters$, canUndo$, canRedo$, mods: {undo$, redo$}} = undoable(model$)

  const counterList = CounterList({...signals, model$: counters$})
  const [{DOM: listDOM$}, rest$] = demux(counterList, "DOM")
  const vdom$ = DOM.prepare(
    O.combineLatest(listDOM$, canUndo$, canRedo$,
      (listVTree, canUndo, canRedo) =>
        h("div", [
          h("button.undo", {disabled: !canUndo}, "Undo"),
          h("button.redo", {disabled: !canRedo}, "Redo"),
          h("hr"),
          listVTree
        ])))

  // undo$ and redo$ are already converted by using model$.mod so there is
  // no need to do that again 
  const mod$ = O.merge(
    undo$.sample(DOM.events(vdom$, ".undo", "click")),
    redo$.sample(DOM.events(vdom$, ".redo", "click"))
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  }, rest$)
}
