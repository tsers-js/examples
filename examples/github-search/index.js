import {Observable as O} from "rx"


export default function main(signals) {
  const {DOM, model$, HTTP, mux} = signals
  const {h} = DOM

  const searchText$ = model$.lens("text")
  const repositories$ = model$.lens("repositories")

  const vdom$ = DOM.prepare(O.combineLatest(searchText$, repositories$,
    (text, repositories) =>
      h("div", [
        h("h1", "GitHub repository search with TSERS"),
        h("input.search", {value: text, placeholder: "Type repository name"}),
        repositories.length === 0 ? h("p", "No results...") :
          h("ul", repositories.map(({name, stars}) =>
            h("li", `${name} (stars: ${stars})`)))
      ])))

  const mod$ = O.merge(
    // change text based on search text input
    searchText$.set(DOM.events(vdom$, ".search", "input").map(e => e.target.value)),
    // load repositories after 500 ms inactivity of typing
    repositories$.set(
      searchText$
        .debounce(500)
        .flatMapLatest(text => text.length < 3 ? O.just([]) :
          search(HTTP, text).map(items => items.map(it => ({
            name: it.full_name,
            stars: it.stargazers_count
          }))))
    )
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  })
}

function search(HTTP, text) {
  // HTTP.request is just another signal transform function having signature
  // Observable requstParams => Observable (Observable response)
  // That's why we have to give the request params with O.just(...)
  // and use .switch() in order to get the actual response
  return HTTP.request(O.just({url: searchUrl(text)}))
    .switch()
    // We are only interested in repository list
    .map(res => res.body.items)
    // If there was a HTTP error, then return empty list
    .catch(O.just([]))
}

function searchUrl(q) {
  return `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc`
}
