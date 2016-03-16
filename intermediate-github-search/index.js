import {Observable as O} from "rx"

const searchUrl = q =>
  `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc`

const main = T => in$ => {
  const {HTTP, DOM: {prepare, events, h}, decompose, compose} = T
  const [actions] = decompose(in$, "textChange$", "reposLoaded$")
  return intent(view(model(actions)))

  function model({textChange$, reposLoaded$}) {
    const text$ = textChange$.startWith("").shareReplay(1)
    const repos$ = reposLoaded$.startWith([]).shareReplay(1)
    return {text$, repos$}
  }

  function view({text$, repos$}) {
    const vdom$ = O.combineLatest(text$, repos$, (text, repos) =>
      h("div", [
        h("h1", "GitHub repository search with TSERS"),
        h("input.search", {value: text, placeholder: "Type repository name"}),
        repos.length === 0 ? h("p", "No results...") :
          h("ul", repos.map(({name, stars}) =>
            h("li", `${name} (stars: ${stars})`)))
      ]))
    return prepare(vdom$)
  }

  function intent(vdom$) {
    const search = text =>
      HTTP.request(O.just({url: searchUrl(text)})).switch().map(res => res.body.items).catch(O.just([]))

    const textChange$ = events(vdom$, ".search", "input").map(e => e.target.value).share()
    const reposLoaded$ = textChange$
      .debounce(300)
      .flatMapLatest(text => text.length < 3 ? O.just([]) : search(text))
      .map(items => items.map(it => ({
        name: it.full_name,
        stars: it.stargazers_count
      })))

    return [compose({DOM: vdom$}), compose({textChange$, reposLoaded$})]
  }
}

export default main
