import {Observable as O} from "rx"

export default function main(signals) {
  const {DOM, mux, loop} = signals
  const {h} = DOM

  const initialText$ = O.just("Tsers").shareReplay(1)
  const vdom$ = loop(initialText$, text$ => {
    const vdom$ = DOM.prepare(text$.map(text =>
      h("div", [
        h("h1", text),
        h("button", "Click me!")
      ])))

    const click$ = DOM.events(vdom$, "button", "click")
    const updatedText$ = click$
      .withLatestFrom(text$, (_, text) => text + "!")

    return [vdom$, updatedText$]
  })

  return mux({
    DOM: vdom$
  })
}
