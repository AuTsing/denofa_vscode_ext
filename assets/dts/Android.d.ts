declare namespace io {
    function toast(): void;

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
