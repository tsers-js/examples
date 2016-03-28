import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model from "@tsers/model"

import main, {nextId} from "./main"

TSERS(main, {
  DOM: ReactDOM("#app"),
  model$: Model([
    {id: nextId(), text: "Hello"},
    {id: nextId(), text: "Tsers"}
  ])
})
