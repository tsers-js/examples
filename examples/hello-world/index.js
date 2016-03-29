import {Observable as O} from "rx"


export default function main(signals) {
  const {DOM: {h, prepare}, mux} = signals

  const letter$ = O.interval(100)
    .startWith(0)
    .map(i => i % 2 ? "!" : ".")

  const vdom$ = prepare(letter$.map(letter =>
    h("div", [
      h("h1", `Tsers ${letter}`)
    ])))

  return mux({
    DOM: vdom$
  })
}
