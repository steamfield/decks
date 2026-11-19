/**
 * A result range the stage plays forward: it enters `first` with a forward
 * `go`, then steps every beat of the slides in `stepBeatsOn` and moves a whole
 * slide at a time elsewhere, until it reaches the end of `last`.
 */
export type PlayRange = {
  first: number;
  last: number;
  stepBeatsOn: readonly number[];
};
