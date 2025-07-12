import { createApp, h } from "vue";
import LoadingComponent from "../components/LoadingComponent.vue";

let loadingInstance = null;

const LoadingService = {
    show() {
        // Prevent creating multiple instances
        if (loadingInstance) {
            return;
        }

        try {
            // Create a new div element for mounting
            const container = document.createElement("div");

            // Create a Vue app instance
            const loadingApp = createApp({
                render() {
                    return h(LoadingComponent);
                },
            });

            // Mount the app to the container
            const component = loadingApp.mount(container);

            // Append the container to the body
            document.body.appendChild(container);

            // Store the instance
            loadingInstance = {
                app: loadingApp,
                el: container,
                component,
            };
        } catch (error) {
            console.error("Failed to show loading component:", error);
        }
    },

    hide() {
        if (loadingInstance) {
            try {
                // Remove the element from the DOM
                if (document.body.contains(loadingInstance.el)) {
                    document.body.removeChild(loadingInstance.el);
                }

                // Unmount the Vue app
                loadingInstance.app.unmount();

                // Clear the instance
                loadingInstance = null;
            } catch (error) {
                console.error("Failed to hide loading component:", error);
            }
        }
    },
};

export default LoadingService;
