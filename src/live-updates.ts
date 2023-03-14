// General class that binds the post message handler
// provides a subscribe function with a callback to receive the new entity and handles the merging of data (GQL + REST)
// this one will be used to build the useContentfulLiveUpdates hook (exported from @contentful/live-preview/react)
// useContentfulLiveUpdates receives the initial data, that should be merged together with the updated entities
// it can be used on the top level (recursive merging on GraphQL Queries), or on one entry directly
// Note: sys.id is required for tagging and merging

// We can create a class, like in field-tagging
// - binds the post message handler to receive the data
// - provides a subscribe fn so the react-hook can updates the state
// - merges the incoming data, with the provided data from the subscribe fn
// - merge fn's are public and could also be used externally
// useContentfuLiveUpdates(content: Entry|Asset | (Entry|Asset)[], locale: string)
// TODO: check order of events (?) (E.g. adding an entry and then changing it, removing an entry, ..)

// subscribe((entity) => )
// useLiveUpdates -> useEffect(() => subscribe() + content)

// subscribe -> if receive an update -> reload the query (!danger! 5s auto save)

// import { ContentfulLivePreview } from '@contentful/live-preview'
// import { useContentfuLiveUpdates } from '@contentful/live-preview/react'
// import { liveUpdateDerictive } from '@contentful/live-preview/vue'

// sys.id is required

// variant a)
// customer loads data with graphql
// useLiveUpdates(data) -> needs to merge the whole tree (recursive merging)
// useContentQuery => useQuery (ssr+csr) + useLiveUpdates (boolean flag if it should use the updates)
// - useQuery could from apollo, react-query, urql, swr ...
// preferred, as it can be also used for variant b)
// con: maybe more components will be rerender on update

// query homepage, title, body, seo, cards
// useLiveUpdates({ cards, seo, body, ... }) <- updates on every data

// variant b)
// customer loads data with graphql
// renders the component for the contentType
// contentType registers useLiveUpdates(data) -> needs to merge only one entry
// useLiveUpdates nees to be registerd on every ContentTypeComponent
// easier to implement, more effort for the DX, maybe better performance

// query homepage, title, body, seo, cards
// card => <CardContentTypeComponent card={card} />
//  useLiveUpdates(card) <- updates only if card changes and we only merge one entry together

// TODO: define a type
export type Entity = Record<string, unknown>
export type SubscribeCallback = (entity: Entity) => void

export class LiveUpdates {
  private subscriptions: { data: Entity, locale: string, cb: SubscribeCallback }[]  = []

  private mergeGraphQL(initial: Entity, locale: string, updated: Entity): Entity {
    // TODO: https://contentful.atlassian.net/browse/TOL-1000
    return initial
  }

  private mergeRest(initial: Entity, locale: string, updated: Entity): Entity {
    // TODO:
    return initial
  }

  private merge(initial: Entity, locale: string, updated: Entity): Entity {
    if ('__typename' in initial) {
      return this.mergeGraphQL(initial, locale, updated)
    }
    return this.mergeRest(initial, locale, updated)
  }

  public bindIncommingMessage(data: Record<string, unknown>): void {
    if (data.entity) {
      this.subscriptions.forEach(s => s.cb(this.merge(s.data, s.locale, data.entity as Entity)))
    }
  }

  public subscribe(data: Entity, locale: string, cb: SubscribeCallback): VoidFunction {
    this.subscriptions.push({ data, locale, cb })

    return () => {
      this.subscriptions = this.subscriptions.filter(f => f.data === data)
    }
  }
}
