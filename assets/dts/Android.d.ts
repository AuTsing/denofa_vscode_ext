// deno-lint-ignore-file no-explicit-any

declare namespace Android {
    namespace io {
        function toast(...args: any[]): void;

        namespace log {
            function verbose(...args: any[]): void;

            function debug(...args: any[]): void;

            function info(...args: any[]): void;

            function warn(...args: any[]): void;

            function error(...args: any[]): void;

            function assert(...args: any[]): void;

            function v(...args: any[]): void;

            function d(...args: any[]): void;

            function i(...args: any[]): void;

            function w(...args: any[]): void;

            function e(...args: any[]): void;

            function a(...args: any[]): void;
        }
    }

    namespace finger {
        namespace accessibility {
            function click(x: number, y: number): Promise<void>;

            function press(x: number, y: number, duration: number | undefined): Promise<void>;

            function swipe(xFrom: number, yFrom: number, xTo: number, yTo: number, duration: number | undefined): Promise<void>;

            function home(): void;

            function back(): void;

            function recents(): void;

            function notifications(): void;

            function lockScreen(): void;

            function powerDialog(): void;

            function quickSettings(): void;

            function takeScreenshot(): void;

            function toggleSplitScreen(): void;
        }
    }

    class Rect {
        left(): number;

        top(): number;

        right(): number;

        bottom(): number;
    }

    class UiObject {
        getParent(): UiObject | null;

        getChild(i: number): UiObject | null;

        getId(): string;

        getDesc(): string;

        getClassName(): string;

        getPackageName(): string;

        getText(): string;

        getDepth(): number;

        getIndexInParent(): number;

        getDrawingOrder(): number;

        getRow(): number;

        getRowSpan(): number;

        getRowCount(): number;

        getColumn(): number;

        getColumnSpan(): number;

        getColumnCount(): number;

        getAccessibilityFocused(): boolean;

        getChecked(): boolean;

        getCheckable(): boolean;

        getClickable(): boolean;

        getContextClickable(): boolean;

        getDismissable(): boolean;

        getEnabled(): boolean;

        getEditable(): boolean;

        getFocusable(): boolean;

        getFocused(): boolean;

        getLongClickable(): boolean;

        getSelected(): boolean;

        getScrollable(): boolean;

        getVisibleToUser(): boolean;

        getPassword(): boolean;

        getContentInvalid(): boolean;

        getMultiLine(): boolean;

        getBoundsInScreen(): Rect;

        getChildCount(): number;

        getChildren(): UiObject[];

        getAllChildren(): UiObject[];

        click(): void;

        longClick(): void;

        accessibilityFocus(): void;

        clearAccessibilityFocus(): void;

        focus(): void;

        clearFocus(): void;

        copy(): void;

        paste(): void;

        select(): void;

        cut(): void;

        collapse(): void;

        expand(): void;

        dismiss(): void;

        showOnScreen(): void;

        scrollForward(): void;

        scrollBackward(): void;

        scrollUp(): void;

        scrollDown(): void;

        scrollLeft(): void;

        scrollRight(): void;

        contextClick(): void;

        setSelection(start: number, end: number): void;

        setText(text: string): void;

        setProgress(value: number): void;

        scrollTo(row: number, column: number): void;
    }

    class UiSelectorBuilder {
        id(id: string): UiSelectorBuilder;

        idEquals(id: string): UiSelectorBuilder;

        idContains(content: string): UiSelectorBuilder;

        idMatches(regex: string): UiSelectorBuilder;

        idStartsWith(prefix: string): UiSelectorBuilder;

        idEndsWith(suffix: string): UiSelectorBuilder;

        text(text: string): UiSelectorBuilder;

        textEquals(text: string): UiSelectorBuilder;

        textContains(content: string): UiSelectorBuilder;

        textMatches(regex: string): UiSelectorBuilder;

        textStartsWith(prefix: string): UiSelectorBuilder;

        textEndsWith(suffix: string): UiSelectorBuilder;

        desc(desc: string): UiSelectorBuilder;

        descEquals(desc: string): UiSelectorBuilder;

        descContains(content: string): UiSelectorBuilder;

        descMatches(regex: string): UiSelectorBuilder;

        descStartsWith(prefix: string): UiSelectorBuilder;

        descEndsWith(suffix: string): UiSelectorBuilder;

        className(className: string): UiSelectorBuilder;

        classNameEquals(className: string): UiSelectorBuilder;

        classNameContains(content: string): UiSelectorBuilder;

        classNameMatches(regex: string): UiSelectorBuilder;

        classNameStartsWith(prefix: string): UiSelectorBuilder;

        classNameEndsWith(suffix: string): UiSelectorBuilder;

        packageName(packageName: string): UiSelectorBuilder;

        packageNameEquals(packageName: string): UiSelectorBuilder;

        packageNameContains(content: string): UiSelectorBuilder;

        packageNameMatches(regex: string): UiSelectorBuilder;

        packageNameStartsWith(prefix: string): UiSelectorBuilder;

        packageNameEndsWith(suffix: string): UiSelectorBuilder;

        bounds(left: number, top: number, right: number, bottom: number): UiSelectorBuilder;

        boundsEquals(left: number, top: number, right: number, bottom: number): UiSelectorBuilder;

        boundsInside(left: number, top: number, right: number, bottom: number): UiSelectorBuilder;

        boundsContains(left: number, top: number, right: number, bottom: number): UiSelectorBuilder;

        checkable(value: boolean | undefined): UiSelectorBuilder;

        checked(value: boolean | undefined): UiSelectorBuilder;

        focusable(value: boolean | undefined): UiSelectorBuilder;

        focused(value: boolean | undefined): UiSelectorBuilder;

        visibleToUser(value: boolean | undefined): UiSelectorBuilder;

        accessibilityFocused(value: boolean | undefined): UiSelectorBuilder;

        selected(value: boolean | undefined): UiSelectorBuilder;

        clickable(value: boolean | undefined): UiSelectorBuilder;

        longClickable(value: boolean | undefined): UiSelectorBuilder;

        enabled(value: boolean | undefined): UiSelectorBuilder;

        password(value: boolean | undefined): UiSelectorBuilder;

        scrollable(value: boolean | undefined): UiSelectorBuilder;

        editable(value: boolean | undefined): UiSelectorBuilder;

        contentInvalid(value: boolean | undefined): UiSelectorBuilder;

        contextClickable(value: boolean | undefined): UiSelectorBuilder;

        multiLine(value: boolean | undefined): UiSelectorBuilder;

        dismissable(value: boolean | undefined): UiSelectorBuilder;

        depth(value: number): UiSelectorBuilder;

        row(value: number): UiSelectorBuilder;

        rowCount(value: number): UiSelectorBuilder;

        rowSpan(value: number): UiSelectorBuilder;

        column(value: number): UiSelectorBuilder;

        columnCount(value: number): UiSelectorBuilder;

        columnSpan(value: number): UiSelectorBuilder;

        indexInParent(value: number): UiSelectorBuilder;

        drawingOrder(value: number): UiSelectorBuilder;

        bfs(): UiSelectorBuilder;

        dfs(): UiSelectorBuilder;

        build(): UiSelector;
    }

    class UiSelector {
        static builder(): UiSelectorBuilder;

        find(): UiObject[];

        findOne(): UiObject;

        untilFind(timeout: number | undefined): Promise<UiObject[]>;

        untilFindOne(timeout: number | undefined): Promise<UiObject>;

        exists(): boolean;

        wait(timeout: number | undefined): Promise<void>;
    }
}
