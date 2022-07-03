import { createReducer, Slice } from '@lib/store';
import { PropertyRef } from '@app/protocols/refs';
import { refOutletActions } from '@app/actions/ref-outlet-actions';
import { refsActions } from '@app/actions/refs-actions';

export interface RefState {
  expandedObjects: Record<number, PropertyRef[]>;
}

export interface RefUiState {
  expandedPaths: Set<string>;
}

export interface RefsState {
  states: Record<string, RefState>;
  uiStates: Record<string, RefUiState>;
}

export type RefsSlice = Slice<'refs', RefsState>;

export const refsReducer = createReducer('refs', {
  states: {},
  uiStates: {},
} as RefsState)
  .add(refOutletActions.Expand, (state, action) => {
    const { stateKey, path } = action.payload;
    if (!state.uiStates[stateKey]) {
      state.uiStates[stateKey] = {
        expandedPaths: new Set(),
      };
    }
    state.uiStates[stateKey].expandedPaths.add(path);
  })
  .add(refOutletActions.Collapse, (state, action) => {
    const { stateKey, path } = action.payload;
    if (!state.uiStates[stateKey]) {
      state.uiStates[stateKey] = {
        expandedPaths: new Set(),
      };
    }
    state.uiStates[stateKey].expandedPaths.delete(path);
  })
  .add(refsActions.RefsForExpandedPathsLoaded, (state, action) => {
    const { stateKey, refs } = action.payload;
    if (!state.states[stateKey]) {
      state.states[stateKey] = {
        expandedObjects: {},
      };
    }
    for (let refsKey in refs) {
      if (!state.states[stateKey].expandedObjects[refsKey]) {
        state.states[stateKey].expandedObjects[refsKey] = refs[refsKey];
      }
    }
  })
  .add(refsActions.RefForInvokedGetterLoaded, (state, action) => {
    const { stateKey, objectId, keyId, ref } = action.payload;
    if (!state.states[stateKey]) {
      state.states[stateKey] = {
        expandedObjects: {},
      };
    }
    const props = state.states[stateKey].expandedObjects[objectId];
    for (let prop of props) {
      if (prop.keyId === keyId) {
        prop.val = ref;
        break;
      }
    }
  });
