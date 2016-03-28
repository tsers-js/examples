import {Observable as O} from "rx"
import Hello from "../03-state-in-model/main"

export default function main(signals) {
  const {DOM, model$, mux, demuxCombined} = signals
  const {h} = DOM

  const children$$ = model$.mapListById((id, item$) =>
    Hello({...signals, model$: item$.lens("text")}))

  const [{DOM: childDOMs$}, rest$] = demuxCombined(children$$, "DOM")

  const vdom$ = DOM.prepare(childDOMs$.map(childDOMs =>
    h("div", [
      ...childDOMs.map((vdom, idx) =>
        h("div", [
          vdom,
          h("button.rm", {"data-idx": idx}, "Remove")
        ])),
      h("hr"),
      h("button.add", "Add new greeting!")
    ])))

  const addMod$ = DOM.events(vdom$, ".add", "click")
    .map(() => items => [...items, {id: nextId(), text: "Tsers"}])
  const rmMod$ = DOM.events(vdom$, ".rm", "click")
    .map(e => Number(e.target.getAttribute("data-idx")))
    .map(idx => items => items.filter((_, i) => i !== idx))

  const mod$ = model$.mod(O.merge(addMod$, rmMod$))

  return mux({
    DOM: vdom$,
    model$: mod$
  }, rest$)
}

export function nextId() {
  window.__ID = window.__ID || 0
  return ++window.__ID
}
