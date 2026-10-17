/* GUI.189: compatibility hooks. Shared PLOT/FOAM lifecycle owns progress.
   No second poller and no machine commands. */
(()=>{'use strict';
 window.ldmFoamCanvasQueueBegin=name=>{if(name)window.v3SetQuickCurrentJobFile?.(name);window.v3SyncQuickActiveJobStatus?.();};
 window.ldmFoamCanvasQueueEnd=async()=>window.v3SyncQuickActiveJobStatus?.();
})();
