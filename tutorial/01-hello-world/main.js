import {Observable as O} from "rx"

export default function main(signals) {
  const {DOM, mux} = signals
  const {h} = DOM

  const vdom$ = DOM.prepare(O.just(
    h("div", [
      h("h1", `Tsers`)
    ])))

  return mux({
    DOM: vdom$
  })
}
