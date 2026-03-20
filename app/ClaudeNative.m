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

        const char *argv[] = {"node", [bootstrapPath UTF8String], NULL};
        int ret = node_start(2, (char **)argv);

        NSLog(@"ClaudeNative: Node.js exited with code %d", ret);
    });
}

@end
