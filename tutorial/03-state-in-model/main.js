import {Observable as O} from "rx"


export default function main(signals) {
  const {DOM, model$: text$, mux} = signals
  const {h} = DOM

  const vdom$ = DOM.prepare(text$.map(text =>
    h("div", [
      h("h1", text),
      h("button", "Click me!")
    ])))

  const click$ = DOM.events(vdom$, "button", "click")
  const updateMod$ = text$.mod(
    click$.map(() => text => text + "!")
  )

  return mux({
    DOM: vdom$,
    model$: updateMod$
  })
}
