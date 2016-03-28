import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model from "@tsers/model"

import main from "./main"

TSERS(main, {
  DOM: ReactDOM("#app"),
  model$: Model("Tsers")      // use initial value "Tsers"
})
