import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Modal dialog, built on the native `<dialog>` element.
 *
 * Native rather than a hand-rolled overlay because `showModal()` gives, for
 * free and correctly, the three things hand-rolled modals almost always get
 * wrong: focus is trapped inside the dialog, Escape closes it, and everything
 * behind it is made inert so a screen reader and the Tab key cannot wander out
 * into the page underneath.
 *
 * Usage:
 *   <zt-modal [open]="confirmOpen()" title="Approve request" (closed)="confirmOpen.set(false)">
 *     <p>Body…</p>
 *     <div ztModalFooter>
 *       <button class="btn btn--secondary" (click)="confirmOpen.set(false)">Cancel</button>
 *       <button class="btn btn--primary" (click)="approve()">Approve</button>
 *     </div>
 *   </zt-modal>
 */
@Component({
  selector: 'zt-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly size = input<ModalSize>('md');

  /**
   * Whether clicking the backdrop dismisses the dialog.
   *
   * Default false. A half-filled form that vanishes because of a stray click
   * an inch outside it is the single most irritating thing a modal can do.
   * Set true only for read-only dialogs where nothing can be lost.
   */
  readonly dismissOnBackdrop = input(false);

  readonly closed = output<void>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      const shouldBeOpen = this.open();

      if (!element) {
        return;
      }

      // Guard both ways: calling showModal() on an already-open dialog throws
      // an InvalidStateError, and close() on a closed one fires a spurious
      // close event that would bounce straight back through `closed`.
      if (shouldBeOpen && !element.open) {
        element.showModal();
      } else if (!shouldBeOpen && element.open) {
        element.close();
      }
    });
  }

  /**
   * Fired by the dialog's own close event — which covers Escape and the form
   * method="dialog" button as well as our close button. Routing every path
   * through one output means the parent's state cannot drift out of sync with
   * what is actually on screen.
   */
  onDialogClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.dismissOnBackdrop()) {
      return;
    }

    // The click target is the <dialog> itself only when the backdrop was hit;
    // clicks on the content bubble from a child element.
    if (event.target === this.dialog()?.nativeElement) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
