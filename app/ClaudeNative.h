#import <Foundation/Foundation.h>

// Claude Code native integration via nodejs-mobile
// Runs Claude Code's CLI directly on ARM64 without x86 emulation

@interface ClaudeNative : NSObject

+ (instancetype)shared;

/// Start the Node.js runtime on a background thread
- (void)startNodeRuntime;

/// Whether the Node.js runtime is ready
@property (nonatomic, readonly) BOOL isReady;

/// Port the Node.js server is listening on (0 if not ready)
@property (nonatomic, readonly) int serverPort;

@end
