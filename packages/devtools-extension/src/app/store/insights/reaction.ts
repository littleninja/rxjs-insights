import {
  combineReactions,
  createReaction,
  effect,
  filterActions,
} from '@lib/store';
import { createUrl, filterRoute } from '@lib/store-router';
import { router, targetRouteToken } from '@app/router';
import {
  concat,
  delay,
  EMPTY,
  endWith,
  from,
  map,
  merge,
  of,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs';
import { insightsClient } from '@app/clients/insights';
import { insightsActions } from '@app/actions/insights-actions';
import { eventsLogActions } from '@app/actions/events-log-actions';
import { getEventElementId } from '@app/utils/get-event-element-id';
import { subscribersGraphActions } from '@app/actions/subscribers-graph-actions';
import { refOutletContextActions } from '@app/actions/ref-outlet-context-actions';
import { appBarActions } from '@app/actions/app-bar-actions';
import { routeEnter, routeLeave } from '@app/utils';

function scrollIntoView(element: HTMLElement) {
  const containerElement = document.getElementById('events-side-panel')!;
  const elementBB = element.getBoundingClientRect();
  const containerElementBB = containerElement.getBoundingClientRect();

  const offset = 96;

  if (
    elementBB.top >= containerElementBB.top + offset &&
    elementBB.bottom <= containerElementBB.bottom - offset
  ) {
    return;
  } else if (elementBB.top < containerElementBB.top + offset) {
    containerElement.scrollBy({
      behavior: 'smooth',
      top: elementBB.top - containerElementBB.top - offset,
    });
  } else {
    containerElement.scrollBy({
      behavior: 'smooth',
      top: elementBB.bottom - containerElementBB.bottom + offset,
    });
  }
}

export const insightsReaction = combineReactions()
  .add(
    createReaction((action$) =>
      action$.pipe(
        routeEnter(targetRouteToken),
        switchMap((route) => {
          const targetId = route.params?.targetId;
          return targetId !== undefined
            ? action$.pipe(
                filterActions(appBarActions.RefreshData),
                startWith(undefined),
                takeUntil(action$.pipe(routeLeave(targetRouteToken))),
                switchMap(() =>
                  from(insightsClient.getTargetState(parseInt(targetId, 10)))
                )
              )
            : EMPTY;
        }),
        map((state) => insightsActions.TargetStateLoaded({ state }))
      )
    )
  )
  .add(
    createReaction((action$) =>
      action$.pipe(
        filterActions([
          eventsLogActions.EventSelected,
          insightsActions.PlayNextEvent,
          refOutletContextActions.FocusEvent,
        ]),
        effect((action) => {
          // const element = document.getElementById(
          //   getEventElementId(action.payload.event.time)
          // );
          // if (element) {
          //   scrollIntoView(element);
          // }
        })
      )
    )
  )
  .add(
    createReaction((action$) =>
      action$.pipe(
        filterActions(eventsLogActions.Play),
        switchMap((action) =>
          concat(
            ...action.payload.events.map((event) =>
              of(insightsActions.PlayNextEvent({ event })).pipe(delay(1000))
            )
          ).pipe(
            takeUntil(
              merge(
                action$.pipe(
                  filterActions([
                    eventsLogActions.Pause,
                    eventsLogActions.EventSelected,
                  ])
                ),
                action$.pipe(
                  filterActions(router.actions.RouteLeave),
                  filterRoute(router, targetRouteToken)
                )
              )
            ),
            endWith(insightsActions.PlayDone())
          )
        )
      )
    )
  )
  .add(
    createReaction((action$) =>
      action$.pipe(
        filterActions([
          subscribersGraphActions.FocusTarget,
          refOutletContextActions.FocusTarget,
        ]),
        map((action) =>
          router.actions.Navigate({
            url: createUrl(['target', String(action.payload.target.id)]),
          })
        )
      )
    )
  );
