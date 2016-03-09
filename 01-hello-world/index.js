import {Observable as O} from "rx"

const main = T => in$ => {
  const {DOM: {h, withEvents}, compose} = T
  return intent(view(model()))

  function model() {
    const second$ = O.interval(1000).startWith(0)
    return second$
  }

  function view(second$) {
    const vdom$ = second$.map(secs => h("div", [
      h("h1", "Tsers!"),
      h("p", `This example has been running ${secs} seconds`)
    ]))
    return withEvents(vdom$)
  }

  function intent(vdom$) {
    return compose({DOM: vdom$})
  }
}

export default main
