#import "ClaudeNative.h"
#import "NodeMobile.h"

@implementation ClaudeNative {
    BOOL _started;
}

+ (instancetype)shared {
    static ClaudeNative *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[ClaudeNative alloc] init];
    });
    return instance;
}

- (void)startNodeRuntime {
    if (_started) return;
    _started = YES;

    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *bootstrapPath = [[NSBundle mainBundle] pathForResource:@"bootstrap"
                                                                 ofType:@"mjs"
                                                            inDirectory:@"claude-native"];
        if (!bootstrapPath) {
            NSLog(@"ClaudeNative: bootstrap.mjs not found in bundle");
            return;
        }

        NSLog(@"ClaudeNative: Starting Node.js with %@", bootstrapPath);

        // Use mutable argv buffer - uv_set_process_title needs writable memory
        char arg0[256] = "node";
        char arg1[] = "--no-deprecation";
        char arg2[4096];
        strlcpy(arg2, [bootstrapPath UTF8String], sizeof(arg2));
        char *argv[] = {arg0, arg1, arg2, NULL};
        int ret = node_start(3, argv);

        NSLog(@"ClaudeNative: Node.js exited with code %d", ret);
    });
}

@end
