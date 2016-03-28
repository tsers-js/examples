import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"

import main from "./main"

// attach interpreters and start the app
TSERS(main, {
  DOM: ReactDOM("#app")
})
