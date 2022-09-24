import {ModelElementResolver} from "./ModelElementResolver";

export default class {
    private readonly element: HTMLElement;
    private readonly modelElementResolver: ModelElementResolver;
    /** Fields that have changed, but whose value is not set back onto the value store */
    private readonly unsyncedInputs: UnsyncedInputContainer;

    private elementEventListeners: Array<{ event: string, callback: (event: any) => void }> = [
        { event: 'input', callback: (event) => this.handleInputEvent(event) },
    ];

    constructor(element: HTMLElement, modelElementResolver: ModelElementResolver) {
        this.element = element;
        this.modelElementResolver = modelElementResolver;
        this.unsyncedInputs = new UnsyncedInputContainer();
    }

    activate(): void {
        this.elementEventListeners.forEach(({event, callback}) => {
            this.element.addEventListener(event, callback);
        });
    }

    deactivate(): void {
        this.elementEventListeners.forEach(({event, callback}) => {
            this.element.removeEventListener(event, callback);
        });
    }

    markModelAsSynced(modelName: string): void {
        this.unsyncedInputs.markModelAsSynced(modelName);
    }

    private handleInputEvent(event: Event) {
        const target = event.target as Element;
        if (!target) {
            return;
        }

        this.updateModelFromElement(target)
    }

    private updateModelFromElement(element: Element) {
        // TODO: put back this child element check
        // if (!elementBelongsToThisController(element, this)) {
        //     return;
        // }

        if (!(element instanceof HTMLElement)) {
            throw new Error('Could not update model for non HTMLElement');
        }

        const modelName = this.modelElementResolver.getModelName(element);
        // track any inputs that are "unsynced"
        this.unsyncedInputs.add(element, modelName);
    }

    getUnsyncedInputs(): HTMLElement[] {
        return this.unsyncedInputs.all();
    }

    getModifiedModels(): string[] {
        return Array.from(this.unsyncedInputs.getModifiedModels());
    }
}

/**
 * Tracks field & models whose values are "unsynced".
 *
 * Unsynced means that the value has been updated inside of
 * a field (e.g. an input), but that this new value hasn't
 * yet been set onto the actual model data. It is "unsynced"
 * from the underlying model data.
 */
export class UnsyncedInputContainer {
    #mappedFields: Map<string, HTMLElement>;
    #unmappedFields: Array<HTMLElement> = [];

    constructor() {
        this.#mappedFields = new Map();
    }

    add(element: HTMLElement, modelName: string|null = null) {
        if (modelName) {
            this.#mappedFields.set(modelName, element);

            return;
        }

        this.#unmappedFields.push(element);
    }

    all(): HTMLElement[] {
        return [...this.#unmappedFields, ...this.#mappedFields.values()]
    }

    markModelAsSynced(modelName: string): void {
        this.#mappedFields.delete(modelName);
    }

    getModifiedModels(): string[] {
        return Array.from(this.#mappedFields.keys());
    }
}
