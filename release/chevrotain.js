/*! chevrotain - v0.5.20 - 2016-03-09 */

(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("chevrotain", [], factory);
	else if(typeof exports === 'object')
		exports["chevrotain"] = factory();
	else
		root["chevrotain"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var parser_public_1 = __webpack_require__(1);
	var lexer_public_1 = __webpack_require__(11);
	var tokens_public_1 = __webpack_require__(10);
	var exceptions_public_1 = __webpack_require__(5);
	var gast_public_1 = __webpack_require__(7);
	var cache_public_1 = __webpack_require__(21);
	/**
	 * defines the public API of
	 * changes here may require major version change. (semVer)
	 */
	var API = {};
	// semantic version
	API.VERSION = "0.5.20";
	// runtime API
	API.Parser = parser_public_1.Parser;
	API.Lexer = lexer_public_1.Lexer;
	API.Token = tokens_public_1.Token;
	API.VirtualToken = tokens_public_1.VirtualToken;
	API.EOF = tokens_public_1.EOF;
	// Tokens utilities
	API.extendToken = tokens_public_1.extendToken;
	API.tokenName = tokens_public_1.tokenName;
	// Other Utilities
	API.EMPTY_ALT = parser_public_1.EMPTY_ALT;
	API.exceptions = {};
	API.exceptions.isRecognitionException = exceptions_public_1.exceptions.isRecognitionException;
	API.exceptions.EarlyExitException = exceptions_public_1.exceptions.EarlyExitException;
	API.exceptions.MismatchedTokenException = exceptions_public_1.exceptions.MismatchedTokenException;
	API.exceptions.NotAllInputParsedException = exceptions_public_1.exceptions.NotAllInputParsedException;
	API.exceptions.NoViableAltException = exceptions_public_1.exceptions.NoViableAltException;
	// grammar reflection API
	API.gast = {};
	API.gast.GAstVisitor = gast_public_1.gast.GAstVisitor;
	API.gast.Flat = gast_public_1.gast.Flat;
	API.gast.Repetition = gast_public_1.gast.Repetition;
	API.gast.RepetitionWithSeparator = gast_public_1.gast.RepetitionWithSeparator;
	API.gast.RepetitionMandatory = gast_public_1.gast.RepetitionMandatory;
	API.gast.RepetitionMandatoryWithSeparator = gast_public_1.gast.RepetitionMandatoryWithSeparator;
	API.gast.Option = gast_public_1.gast.Option;
	API.gast.Alternation = gast_public_1.gast.Alternation;
	API.gast.NonTerminal = gast_public_1.gast.NonTerminal;
	API.gast.Terminal = gast_public_1.gast.Terminal;
	API.gast.Rule = gast_public_1.gast.Rule;
	API.clearCache = cache_public_1.clearCache;
	module.exports = API;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var cache = __webpack_require__(2);
	var exceptions_public_1 = __webpack_require__(5);
	var lang_extensions_1 = __webpack_require__(3);
	var resolver_1 = __webpack_require__(6);
	var checks_1 = __webpack_require__(8);
	var utils_1 = __webpack_require__(4);
	var follow_1 = __webpack_require__(14);
	var tokens_public_1 = __webpack_require__(10);
	var lookahead_1 = __webpack_require__(17);
	var gast_builder_1 = __webpack_require__(19);
	var interpreter_1 = __webpack_require__(18);
	var constants_1 = __webpack_require__(16);
	(function (ParserDefinitionErrorType) {
	    ParserDefinitionErrorType[ParserDefinitionErrorType["INVALID_RULE_NAME"] = 0] = "INVALID_RULE_NAME";
	    ParserDefinitionErrorType[ParserDefinitionErrorType["DUPLICATE_RULE_NAME"] = 1] = "DUPLICATE_RULE_NAME";
	    ParserDefinitionErrorType[ParserDefinitionErrorType["DUPLICATE_PRODUCTIONS"] = 2] = "DUPLICATE_PRODUCTIONS";
	    ParserDefinitionErrorType[ParserDefinitionErrorType["UNRESOLVED_SUBRULE_REF"] = 3] = "UNRESOLVED_SUBRULE_REF";
	    ParserDefinitionErrorType[ParserDefinitionErrorType["LEFT_RECURSION"] = 4] = "LEFT_RECURSION";
	    ParserDefinitionErrorType[ParserDefinitionErrorType["NONE_LAST_EMPTY_ALT"] = 5] = "NONE_LAST_EMPTY_ALT";
	})(exports.ParserDefinitionErrorType || (exports.ParserDefinitionErrorType = {}));
	var ParserDefinitionErrorType = exports.ParserDefinitionErrorType;
	/**
	 * convenience used to express an empty alternative in an OR (alternation).
	 * can be used to more clearly describe the intent in a case of empty alternation.
	 *
	 * for example:
	 *
	 * 1. without using EMPTY_ALT:
	 *
	 *    this.OR([
	 *      {ALT: () => {
	 *        this.CONSUME1(OneTok)
	 *        return "1"
	 *      }},
	 *      {ALT: () => {
	 *        this.CONSUME1(TwoTok)
	 *        return "2"
	 *      }},
	 *      {ALT: () => { // implicitly empty because there are no invoked grammar rules (OR/MANY/CONSUME...) inside this alternative.
	 *        return "666"
	 *      }},
	 *    ])
	 *
	 *
	 * * 2. using EMPTY_ALT:
	 *
	 *    this.OR([
	 *      {ALT: () => {
	 *        this.CONSUME1(OneTok)
	 *        return "1"
	 *      }},
	 *      {ALT: () => {
	 *        this.CONSUME1(TwoTok)
	 *        return "2"
	 *      }},
	 *      {ALT: EMPTY_ALT("666")}, // explicitly empty, clearer intent
	 *    ])
	 *
	 */
	function EMPTY_ALT(value) {
	    if (value === void 0) { value = undefined; }
	    return function () {
	        return value;
	    };
	}
	exports.EMPTY_ALT = EMPTY_ALT;
	var EOF_FOLLOW_KEY = {};
	/**
	 * A Recognizer capable of self analysis to determine it's grammar structure
	 * This is used for more advanced features requiring such information.
	 * for example: Error Recovery, Automatic lookahead calculation
	 */
	var Parser = (function () {
	    function Parser(input, tokensMapOrArr, isErrorRecoveryEnabled) {
	        if (isErrorRecoveryEnabled === void 0) { isErrorRecoveryEnabled = true; }
	        this.errors = [];
	        this._input = [];
	        this.inputIdx = -1;
	        this.isBackTrackingStack = [];
	        this.RULE_STACK = [];
	        this.RULE_OCCURRENCE_STACK = [];
	        this.tokensMap = undefined;
	        this.definedRulesNames = [];
	        this._input = input;
	        this.isErrorRecoveryEnabled = isErrorRecoveryEnabled;
	        this.className = lang_extensions_1.classNameFromInstance(this);
	        this.firstAfterRepMap = cache.getFirstAfterRepForClass(this.className);
	        this.classLAFuncs = cache.getLookaheadFuncsForClass(this.className);
	        if (!cache.CLASS_TO_DEFINITION_ERRORS.containsKey(this.className)) {
	            this.definitionErrors = [];
	            cache.CLASS_TO_DEFINITION_ERRORS.put(this.className, this.definitionErrors);
	        }
	        else {
	            this.definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(this.className);
	        }
	        if (utils_1.isArray(tokensMapOrArr)) {
	            this.tokensMap = utils_1.reduce(tokensMapOrArr, function (acc, tokenClazz) {
	                acc[tokens_public_1.tokenName(tokenClazz)] = tokenClazz;
	                return acc;
	            }, {});
	        }
	        else if (utils_1.isObject(tokensMapOrArr)) {
	            this.tokensMap = utils_1.cloneObj(tokensMapOrArr);
	        }
	        else {
	            throw new Error("'tokensMapOrArr' argument must be An Array of Token constructors or a Dictionary of Tokens.");
	        }
	        // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
	        // parsed with a clear error message ("expecting EOF but found ...")
	        this.tokensMap[tokens_public_1.tokenName(tokens_public_1.EOF)] = tokens_public_1.EOF;
	        if (cache.CLASS_TO_OR_LA_CACHE[this.className] === undefined) {
	            cache.initLookAheadKeyCache(this.className);
	        }
	        this.orLookaheadKeys = cache.CLASS_TO_OR_LA_CACHE[this.className];
	        this.manyLookaheadKeys = cache.CLASS_TO_MANY_LA_CACHE[this.className];
	        this.manySepLookaheadKeys = cache.CLASS_TO_MANY_SEP_LA_CACHE[this.className];
	        this.atLeastOneLookaheadKeys = cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE[this.className];
	        this.atLeastOneSepLookaheadKeys = cache.CLASS_TO_AT_LEAST_ONE_SEP_LA_CACHE[this.className];
	        this.optionLookaheadKeys = cache.CLASS_TO_OPTION_LA_CACHE[this.className];
	    }
	    Parser.performSelfAnalysis = function (classInstance) {
	        var definitionErrors = [];
	        var defErrorsMsgs;
	        var className = lang_extensions_1.classNameFromInstance(classInstance);
	        if (className === "") {
	            // just a simple "throw Error" without any fancy "definition error" because the logic below relies on a unique parser name to
	            // save/access those definition errors...
	            throw Error("A Parser's constructor may not be an anonymous Function, it must be a named function\n" +
	                "The constructor's name is used at runtime for performance (caching) purposes.");
	        }
	        // this information should only be computed once
	        if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
	            var grammarProductions = cache.getProductionsForClass(className);
	            // assumes this cache has been initialized (in the relevant parser's constructor)
	            // TODO: consider making the self analysis a member method to resolve this.
	            // that way it won't be callable before the constructor has been invoked...
	            definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(className);
	            var resolverErrors = resolver_1.resolveGrammar(grammarProductions);
	            definitionErrors.push.apply(definitionErrors, resolverErrors); // mutability for the win?
	            cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true);
	            var validationErrors = checks_1.validateGrammar(grammarProductions.values());
	            definitionErrors.push.apply(definitionErrors, validationErrors); // mutability for the win?
	            if (!utils_1.isEmpty(definitionErrors) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
	                defErrorsMsgs = utils_1.map(definitionErrors, function (defError) { return defError.message; });
	                throw new Error("Parser Definition Errors detected\n: " + defErrorsMsgs.join("\n-------------------------------\n"));
	            }
	            if (utils_1.isEmpty(definitionErrors)) {
	                var allFollows = follow_1.computeAllProdsFollows(grammarProductions.values());
	                cache.setResyncFollowsForClass(className, allFollows);
	            }
	        }
	        // reThrow the validation errors each time an erroneous parser is instantiated
	        if (!utils_1.isEmpty(cache.CLASS_TO_DEFINITION_ERRORS.get(className)) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
	            defErrorsMsgs = utils_1.map(cache.CLASS_TO_DEFINITION_ERRORS.get(className), function (defError) { return defError.message; });
	            throw new Error("Parser Definition Errors detected\n: " + defErrorsMsgs.join("\n-------------------------------\n"));
	        }
	    };
	    Object.defineProperty(Parser.prototype, "input", {
	        get: function () {
	            return utils_1.cloneArr(this._input);
	        },
	        set: function (newInput) {
	            this.reset();
	            this._input = newInput;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Parser.prototype.reset = function () {
	        this.isBackTrackingStack = [];
	        this.errors = [];
	        this._input = [];
	        this.inputIdx = -1;
	        this.RULE_STACK = [];
	        this.RULE_OCCURRENCE_STACK = [];
	    };
	    Parser.prototype.isAtEndOfInput = function () {
	        return this.LA(1) instanceof tokens_public_1.EOF;
	    };
	    Parser.prototype.getGAstProductions = function () {
	        return cache.getProductionsForClass(this.className);
	    };
	    Parser.prototype.isBackTracking = function () {
	        return !(utils_1.isEmpty(this.isBackTrackingStack));
	    };
	    Parser.prototype.SAVE_ERROR = function (error) {
	        if (exceptions_public_1.exceptions.isRecognitionException(error)) {
	            this.errors.push(error);
	            return error;
	        }
	        else {
	            throw Error("trying to save an Error which is not a RecognitionException");
	        }
	    };
	    Parser.prototype.NEXT_TOKEN = function () {
	        return this.LA(1);
	    };
	    Parser.prototype.LA = function (howMuch) {
	        if (this._input.length <= this.inputIdx + howMuch) {
	            return new tokens_public_1.EOF();
	        }
	        else {
	            return this._input[this.inputIdx + howMuch];
	        }
	    };
	    Parser.prototype.isNextRule = function (ruleName) {
	        var classLAFuncs = cache.getLookaheadFuncsForClass(this.className);
	        var condition = classLAFuncs.get(ruleName);
	        if (condition === undefined) {
	            var ruleGrammar = this.getGAstProductions().get(ruleName);
	            condition = lookahead_1.buildLookaheadForTopLevel(ruleGrammar);
	            classLAFuncs.put(ruleName, condition);
	        }
	        return condition.call(this);
	    };
	    /**
	     *
	     * @param grammarRule the rule to try and parse in backtracking mode
	     * @param isValid a predicate that given the result of the parse attempt will "decide" if the parse was successfully or not
	     * @return a lookahead function that will try to parse the given grammarRule and will return true if succeed
	     */
	    Parser.prototype.BACKTRACK = function (grammarRule, isValid) {
	        var _this = this;
	        return function () {
	            // save org state
	            _this.isBackTrackingStack.push(1);
	            var orgState = _this.saveRecogState();
	            try {
	                var ruleResult = grammarRule.call(_this);
	                return isValid(ruleResult);
	            }
	            catch (e) {
	                if (exceptions_public_1.exceptions.isRecognitionException(e)) {
	                    return false;
	                }
	                else {
	                    throw e;
	                }
	            }
	            finally {
	                _this.reloadRecogState(orgState);
	                _this.isBackTrackingStack.pop();
	            }
	        };
	    };
	    // skips a token and returns the next token
	    Parser.prototype.SKIP_TOKEN = function () {
	        // example: assume 45 tokens in the input, if input index is 44 it means that NEXT_TOKEN will return
	        // input[45] which is the 46th item and no longer exists,
	        // so in this case the largest valid input index is 43 (input.length - 2 )
	        if (this.inputIdx <= this._input.length - 2) {
	            this.inputIdx++;
	            return this.NEXT_TOKEN();
	        }
	        else {
	            return new tokens_public_1.EOF();
	        }
	    };
	    // Parsing DSL
	    /**
	     * Convenience method equivalent to CONSUME1
	     * @see CONSUME1
	     */
	    Parser.prototype.CONSUME = function (tokClass) {
	        return this.CONSUME1(tokClass);
	    };
	    /**
	     *
	     * A Parsing DSL method use to consume a single terminal Token.
	     * a Token will be consumed, IFF the next token in the token vector is an instanceof tokClass.
	     * otherwise the parser will attempt to perform error recovery.
	     *
	     * The index in the method name indicates the unique occurrence of a terminal consumption
	     * inside a the top level rule. What this means is that if a terminal appears
	     * more than once in a single rule, each appearance must have a difference index.
	     *
	     * for example:
	     *
	     * function parseQualifiedName() {
	     *    this.CONSUME1(Identifier);
	     *    this.MANY(()=> {
	     *       this.CONSUME1(Dot);
	     *       this.CONSUME2(Identifier); // <-- here we use CONSUME2 because the terminal
	     *    });                           //     'Identifier' has already appeared previously in the
	     *                                  //     the rule 'parseQualifiedName'
	     * }
	     *
	     * @param {Function} tokClass A constructor function specifying the type of token
	     *        to be consumed.
	     *
	     * @returns {Token} The consumed token.
	     */
	    Parser.prototype.CONSUME1 = function (tokClass) {
	        return this.consumeInternal(tokClass, 1);
	    };
	    /**
	     * @see CONSUME1
	     */
	    Parser.prototype.CONSUME2 = function (tokClass) {
	        return this.consumeInternal(tokClass, 2);
	    };
	    /**
	     * @see CONSUME1
	     */
	    Parser.prototype.CONSUME3 = function (tokClass) {
	        return this.consumeInternal(tokClass, 3);
	    };
	    /**
	     * @see CONSUME1
	     */
	    Parser.prototype.CONSUME4 = function (tokClass) {
	        return this.consumeInternal(tokClass, 4);
	    };
	    /**
	     * @see CONSUME1
	     */
	    Parser.prototype.CONSUME5 = function (tokClass) {
	        return this.consumeInternal(tokClass, 5);
	    };
	    /**
	     * Convenience method equivalent to SUBRULE1
	     * @see SUBRULE1
	     */
	    Parser.prototype.SUBRULE = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return this.SUBRULE1(ruleToCall, args);
	    };
	    /**
	     * The Parsing DSL Method is used by one rule to call another.
	     *
	     * This may seem redundant as it does not actually do much.
	     * However using it is mandatory for all sub rule invocations.
	     * calling another rule without wrapping in SUBRULE(...)
	     * will cause errors/mistakes in the Recognizer's self analysis
	     * which will lead to errors in error recovery/automatic lookahead calculation
	     * and any other functionality relying on the Recognizer's self analysis
	     * output.
	     *
	     * As in CONSUME the index in the method name indicates the occurrence
	     * of the sub rule invocation in its rule.
	     *
	     * @param {Function} ruleToCall the rule to invoke
	     * @param {*[]} args the arguments to pass to the invoked subrule
	     * @returns {*} the result of invoking ruleToCall
	     */
	    Parser.prototype.SUBRULE1 = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return ruleToCall.call(this, 1, args);
	    };
	    /**
	     * @see SUBRULE1
	     */
	    Parser.prototype.SUBRULE2 = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return ruleToCall.call(this, 2, args);
	    };
	    /**
	     * @see SUBRULE1
	     */
	    Parser.prototype.SUBRULE3 = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return ruleToCall.call(this, 3, args);
	    };
	    /**
	     * @see SUBRULE1
	     */
	    Parser.prototype.SUBRULE4 = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return ruleToCall.call(this, 4, args);
	    };
	    /**
	     * @see SUBRULE1
	     */
	    Parser.prototype.SUBRULE5 = function (ruleToCall, args) {
	        if (args === void 0) { args = []; }
	        return ruleToCall.call(this, 5, args);
	    };
	    /**
	     * Convenience method equivalent to OPTION1
	     * @see OPTION1
	     */
	    Parser.prototype.OPTION = function (laFuncOrAction, action) {
	        return this.OPTION1.call(this, laFuncOrAction, action);
	    };
	    /**
	     * Parsing DSL Method that Indicates an Optional production
	     * in EBNF notation: [...]
	     *
	     * note that the 'action' param is optional. so both of the following forms are valid:
	     *
	     * short: this.OPTION(()=>{ this.CONSUME(Digit});
	     * long: this.OPTION(isDigit, ()=>{ this.CONSUME(Digit});
	     *
	     * using the short form is recommended as it will compute the lookahead function
	     * automatically. however this currently has one limitation:
	     * It only works if the lookahead for the grammar is one.
	     *
	     * As in CONSUME the index in the method name indicates the occurrence
	     * of the optional production in it's top rule.
	     *
	     * @param {Function} laFuncOrAction The lookahead function that 'decides'
	     *                                  whether or not the OPTION's action will be
	     *                                  invoked or the action to optionally invoke
	     * @param {Function} [action] The action to optionally invoke.
	     *
	     * @returns {boolean} true iff the OPTION's action has been invoked
	     */
	    Parser.prototype.OPTION1 = function (laFuncOrAction, action) {
	        if (action === undefined) {
	            action = laFuncOrAction;
	            laFuncOrAction = this.getLookaheadFuncForOption(1);
	        }
	        return this.optionInternal(laFuncOrAction, action);
	    };
	    /**
	     * @see OPTION1
	     */
	    Parser.prototype.OPTION2 = function (laFuncOrAction, action) {
	        if (action === undefined) {
	            action = laFuncOrAction;
	            laFuncOrAction = this.getLookaheadFuncForOption(2);
	        }
	        return this.optionInternal(laFuncOrAction, action);
	    };
	    /**
	     * @see OPTION1
	     */
	    Parser.prototype.OPTION3 = function (laFuncOrAction, action) {
	        if (action === undefined) {
	            action = laFuncOrAction;
	            laFuncOrAction = this.getLookaheadFuncForOption(3);
	        }
	        return this.optionInternal(laFuncOrAction, action);
	    };
	    /**
	     * @see OPTION1
	     */
	    Parser.prototype.OPTION4 = function (laFuncOrAction, action) {
	        if (action === undefined) {
	            action = laFuncOrAction;
	            laFuncOrAction = this.getLookaheadFuncForOption(4);
	        }
	        return this.optionInternal(laFuncOrAction, action);
	    };
	    /**
	     * @see OPTION1
	     */
	    Parser.prototype.OPTION5 = function (laFuncOrAction, action) {
	        if (action === undefined) {
	            action = laFuncOrAction;
	            laFuncOrAction = this.getLookaheadFuncForOption(5);
	        }
	        return this.optionInternal(laFuncOrAction, action);
	    };
	    /**
	     * Convenience method equivalent to OR1
	     * @see OR1
	     */
	    Parser.prototype.OR = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.OR1(alts, errMsgTypes, ignoreAmbiguities);
	    };
	    /**
	     * Parsing DSL method that indicates a choice between a set of alternatives must be made.
	     * This is equivalent to EBNF alternation (A | B | C | D ...)
	     *
	     * There are two forms:
	     *
	     * short: this.OR([
	     *           {ALT:()=>{this.CONSUME(One)}},
	     *           {ALT:()=>{this.CONSUME(Two)}},
	     *           {ALT:()=>{this.CONSUME(Three)}},
	     *        ], "a number")
	     *
	     * long: this.OR([
	     *           {WHEN: isOne, THEN_DO:()=>{this.CONSUME(One)}},
	     *           {WHEN: isTwo, THEN_DO:()=>{this.CONSUME(Two)}},
	     *           {WHEN: isThree, THEN_DO:()=>{this.CONSUME(Three)}},
	     *        ], "a number")
	     *
	     * using the short form is recommended as it will compute the lookahead function
	     * automatically. however this currently has one limitation:
	     * It only works if the lookahead for the grammar is one LL(1).
	     *
	     * As in CONSUME the index in the method name indicates the occurrence
	     * of the alternation production in it's top rule.
	     *
	     * @param {{ALT:Function}[] | {WHEN:Function, THEN_DO:Function}[]} alts - An array of alternatives
	     *
	     * @param {string} [errMsgTypes] - A description for the alternatives used in error messages
	     *                                 If none is provided, the error message will include the names of the expected
	     *                                 Tokens which may start each alternative.
	     *
	     * @param {boolean} [ignoreAmbiguities] - if true this will ignore ambiguities caused when two alternatives can not
	     *        be distinguished by a lookahead of one. enabling this means the first alternative
	     *        that matches will be taken. This is sometimes the grammar's intent.
	     *        * only enable this if you know what you are doing!
	     *
	     * @returns {*} The result of invoking the chosen alternative

	     */
	    Parser.prototype.OR1 = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.orInternal(alts, errMsgTypes, 1, ignoreAmbiguities);
	    };
	    /**
	     * @see OR1
	     */
	    Parser.prototype.OR2 = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.orInternal(alts, errMsgTypes, 2, ignoreAmbiguities);
	    };
	    /**
	     * @see OR1
	     */
	    Parser.prototype.OR3 = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.orInternal(alts, errMsgTypes, 3, ignoreAmbiguities);
	    };
	    /**
	     * @see OR1
	     */
	    Parser.prototype.OR4 = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.orInternal(alts, errMsgTypes, 4, ignoreAmbiguities);
	    };
	    /**
	     * @see OR1
	     */
	    Parser.prototype.OR5 = function (alts, errMsgTypes, ignoreAmbiguities) {
	        if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	        return this.orInternal(alts, errMsgTypes, 5, ignoreAmbiguities);
	    };
	    /**
	     * Convenience method equivalent to MANY1
	     * @see MANY1
	     */
	    Parser.prototype.MANY = function (laFuncOrAction, action) {
	        return this.MANY1.call(this, laFuncOrAction, action);
	    };
	    /**
	     * Parsing DSL method, that indicates a repetition of zero or more.
	     * This is equivalent to EBNF repetition {...}
	     *
	     * note that the 'action' param is optional. so both of the following forms are valid:
	     *
	     * short: this.MANY(()=>{
	     *                       this.CONSUME(Comma};
	     *                       this.CONSUME(Digit});
	     * long: this.MANY(isComma, ()=>{
	     *                       this.CONSUME(Comma};
	     *                       this.CONSUME(Digit});
	     *
	     * using the short form is recommended as it will compute the lookahead function
	     * automatically. however this currently has one limitation:
	     * It only works if the lookahead for the grammar is one.
	     *
	     * As in CONSUME the index in the method name indicates the occurrence
	     * of the repetition production in it's top rule.
	     *
	     * @param {Function} laFuncOrAction The lookahead function that 'decides'
	     *                                  whether or not the MANY's action will be
	     *                                  invoked or the action to optionally invoke
	     * @param {Function} [action] The action to optionally invoke.
	     */
	    Parser.prototype.MANY1 = function (laFuncOrAction, action) {
	        this.manyInternal(this.MANY1, "MANY1", 1, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY1
	     */
	    Parser.prototype.MANY2 = function (laFuncOrAction, action) {
	        this.manyInternal(this.MANY2, "MANY2", 2, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY1
	     */
	    Parser.prototype.MANY3 = function (laFuncOrAction, action) {
	        this.manyInternal(this.MANY3, "MANY3", 3, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY1
	     */
	    Parser.prototype.MANY4 = function (laFuncOrAction, action) {
	        this.manyInternal(this.MANY4, "MANY4", 4, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY1
	     */
	    Parser.prototype.MANY5 = function (laFuncOrAction, action) {
	        this.manyInternal(this.MANY5, "MANY5", 5, laFuncOrAction, action);
	    };
	    /**
	     * Convenience method equivalent to MANY_SEP1
	     * @see MANY_SEP1
	     */
	    Parser.prototype.MANY_SEP = function (separator, laFuncOrAction, action) {
	        return this.MANY_SEP1.call(this, separator, laFuncOrAction, action);
	    };
	    /**
	     * Parsing DSL method, that indicates a repetition of zero or more with a separator
	     * Token between the repetitions.
	     *
	     * note that the 'action' param is optional. so both of the following forms are valid:
	     *
	     * short: this.MANY_SEP(Comma, ()=>{
	     *                          this.CONSUME(Number};
	     *                       ...
	     *                       );
	     *
	     * long: this.MANY(Comma, isNumber, ()=>{
	     *                           this.CONSUME(Number}
	     *                       ...
	     *                       );
	     *
	     * using the short form is recommended as it will compute the lookahead function
	     * (for the first iteration) automatically. however this currently has one limitation:
	     * It only works if the lookahead for the grammar is one.
	     *
	     * As in CONSUME the index in the method name indicates the occurrence
	     * of the repetition production in it's top rule.
	     *
	     * @param separator - The Token to use as a separator between repetitions.
	     * @param {Function} laFuncOrAction - The lookahead function that 'decides'
	     *                                  whether or not the MANY_SEP's action will be
	     *                                  invoked or the action to optionally invoke
	     * @param {Function} [action] - The action to optionally invoke.
	     *
	     * @return {Token[]} - The consumed separator Tokens.
	     */
	    Parser.prototype.MANY_SEP1 = function (separator, laFuncOrAction, action) {
	        return this.manySepFirstInternal(this.MANY_SEP1, "MANY_SEP1", 1, separator, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY_SEP1
	     */
	    Parser.prototype.MANY_SEP2 = function (separator, laFuncOrAction, action) {
	        return this.manySepFirstInternal(this.MANY_SEP2, "MANY_SEP2", 2, separator, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY_SEP1
	     */
	    Parser.prototype.MANY_SEP3 = function (separator, laFuncOrAction, action) {
	        return this.manySepFirstInternal(this.MANY_SEP3, "MANY_SEP3", 3, separator, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY_SEP1
	     */
	    Parser.prototype.MANY_SEP4 = function (separator, laFuncOrAction, action) {
	        return this.manySepFirstInternal(this.MANY_SEP4, "MANY_SEP4", 4, separator, laFuncOrAction, action);
	    };
	    /**
	     * @see MANY_SEP1
	     */
	    Parser.prototype.MANY_SEP5 = function (separator, laFuncOrAction, action) {
	        return this.manySepFirstInternal(this.MANY_SEP5, "MANY_SEP5", 5, separator, laFuncOrAction, action);
	    };
	    /**
	     * Convenience method equivalent to AT_LEAST_ONE1
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE = function (laFuncOrAction, action, errMsg) {
	        return this.AT_LEAST_ONE1.call(this, laFuncOrAction, action, errMsg);
	    };
	    /**
	     *
	     * convenience method, same as MANY but the repetition is of one or more.
	     * failing to match at least one repetition will result in a parsing error and
	     * cause the parser to attempt error recovery.
	     *
	     * @see MANY1
	     *
	     * @param {Function} laFuncOrAction The lookahead function that 'decides'
	     *                                  whether or not the AT_LEAST_ONE's action will be
	     *                                  invoked or the action to optionally invoke
	     * @param {Function} [action] The action to optionally invoke.
	     * @param {string} [errMsg] short title/classification to what is being matched
	     */
	    Parser.prototype.AT_LEAST_ONE1 = function (laFuncOrAction, action, errMsg) {
	        this.atLeastOneInternal(this.AT_LEAST_ONE1, "AT_LEAST_ONE1", 1, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE2 = function (laFuncOrAction, action, errMsg) {
	        this.atLeastOneInternal(this.AT_LEAST_ONE2, "AT_LEAST_ONE2", 2, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE3 = function (laFuncOrAction, action, errMsg) {
	        this.atLeastOneInternal(this.AT_LEAST_ONE3, "AT_LEAST_ONE3", 3, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE4 = function (laFuncOrAction, action, errMsg) {
	        this.atLeastOneInternal(this.AT_LEAST_ONE4, "AT_LEAST_ONE4", 4, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE5 = function (laFuncOrAction, action, errMsg) {
	        this.atLeastOneInternal(this.AT_LEAST_ONE5, "AT_LEAST_ONE5", 5, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * Convenience method equivalent to AT_LEAST_ONE_SEP1
	     * @see AT_LEAST_ONE1
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP = function (separator, laFuncOrAction, action, errMsg) {
	        return this.AT_LEAST_ONE_SEP1.call(this, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     *
	     * convenience method, same as MANY_SEP but the repetition is of one or more.
	     * failing to match at least one repetition will result in a parsing error and
	     * cause the parser to attempt error recovery.
	     *
	     * @see MANY_SEP1
	     *
	     * @param separator {Token}
	     * @param {Function} laFuncOrAction The lookahead function that 'decides'
	     *                                  whether or not the AT_LEAST_ONE's action will be
	     *                                  invoked or the action to optionally invoke
	     * @param {Function} [action] The action to optionally invoke.
	     * @param {string} [errMsg] short title/classification to what is being matched
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP1 = function (separator, laFuncOrAction, action, errMsg) {
	        return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP1", 1, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE_SEP1
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP2 = function (separator, laFuncOrAction, action, errMsg) {
	        return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP2", 2, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE_SEP1
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP3 = function (separator, laFuncOrAction, action, errMsg) {
	        return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP3", 3, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE_SEP1
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP4 = function (separator, laFuncOrAction, action, errMsg) {
	        return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP4", 4, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * @see AT_LEAST_ONE_SEP1
	     */
	    Parser.prototype.AT_LEAST_ONE_SEP5 = function (separator, laFuncOrAction, action, errMsg) {
	        return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP5", 5, separator, laFuncOrAction, action, errMsg);
	    };
	    /**
	     * Convenience method, same as RULE with doReSync=false
	     * @see RULE
	     */
	    Parser.prototype.RULE_NO_RESYNC = function (ruleName, impl, invalidRet) {
	        return this.RULE(ruleName, impl, invalidRet, false);
	    };
	    /**
	     *
	     * @param {string} ruleName The name of the Rule. must match the let it is assigned to.
	     * @param {Function} impl The implementation of the Rule
	     * @param {Function} [invalidRet] A function that will return the chosen invalid value for the rule in case of
	     *                   re-sync recovery.
	     * @param {boolean} [doReSync] enable or disable re-sync recovery for this rule. defaults to true
	     * @returns {Function} The parsing rule which is the impl Function wrapped with the parsing logic that handles
	     *                     Parser state / error recovery / ...
	     */
	    Parser.prototype.RULE = function (ruleName, impl, invalidRet, doReSync) {
	        if (invalidRet === void 0) { invalidRet = this.defaultInvalidReturn; }
	        if (doReSync === void 0) { doReSync = true; }
	        // TODO: isEntryPoint by default true? SUBRULE explicitly pass false?
	        var ruleNameErrors = checks_1.validateRuleName(ruleName, this.definedRulesNames, this.className);
	        this.definedRulesNames.push(ruleName);
	        this.definitionErrors.push.apply(this.definitionErrors, ruleNameErrors); // mutability for the win
	        var parserClassProductions = cache.getProductionsForClass(this.className);
	        // only build the gast representation once
	        if (!(parserClassProductions.containsKey(ruleName))) {
	            var gastProduction = gast_builder_1.buildTopProduction(impl.toString(), ruleName, this.tokensMap);
	            parserClassProductions.put(ruleName, gastProduction);
	        }
	        var wrappedGrammarRule = function (idxInCallingRule, args) {
	            if (idxInCallingRule === void 0) { idxInCallingRule = 1; }
	            if (args === void 0) { args = []; }
	            this.ruleInvocationStateUpdate(ruleName, idxInCallingRule);
	            try {
	                // actual parsing happens here
	                return impl.apply(this, args);
	            }
	            catch (e) {
	                var isFirstInvokedRule = (this.RULE_STACK.length === 1);
	                // note the reSync is always enabled for the first rule invocation, because we must always be able to
	                // reSync with EOF and just output some INVALID ParseTree
	                // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
	                // path is really the most valid one
	                var reSyncEnabled = isFirstInvokedRule || (doReSync
	                    && !this.isBackTracking()
	                    && this.isErrorRecoveryEnabled);
	                if (reSyncEnabled && exceptions_public_1.exceptions.isRecognitionException(e)) {
	                    var reSyncTokType = this.findReSyncTokenType();
	                    if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
	                        this.reSyncTo(reSyncTokType);
	                        return invalidRet();
	                    }
	                    else {
	                        // to be handled farther up the call stack
	                        throw e;
	                    }
	                }
	                else {
	                    // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
	                    throw e;
	                }
	            }
	            finally {
	                this.ruleFinallyStateUpdate();
	            }
	        };
	        var ruleNamePropName = "ruleName";
	        wrappedGrammarRule[ruleNamePropName] = ruleName;
	        return wrappedGrammarRule;
	    };
	    Parser.prototype.ruleInvocationStateUpdate = function (ruleName, idxInCallingRule) {
	        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule);
	        this.RULE_STACK.push(ruleName);
	    };
	    Parser.prototype.ruleFinallyStateUpdate = function () {
	        this.RULE_STACK.pop();
	        this.RULE_OCCURRENCE_STACK.pop();
	        var maxInputIdx = this._input.length - 1;
	        if ((this.RULE_STACK.length === 0) && this.inputIdx < maxInputIdx) {
	            var firstRedundantTok = this.NEXT_TOKEN();
	            this.SAVE_ERROR(new exceptions_public_1.exceptions.NotAllInputParsedException("Redundant input, expecting EOF but found: " + firstRedundantTok.image, firstRedundantTok));
	        }
	    };
	    /**
	     * Returns an "imaginary" Token to insert when Single Token Insertion is done
	     * Override this if you require special behavior in your grammar
	     * for example if an IntegerToken is required provide one with the image '0' so it would be valid syntactically
	     */
	    Parser.prototype.getTokenToInsert = function (tokClass) {
	        return new tokClass(-1, -1);
	    };
	    /**
	     * By default all tokens type may be inserted. This behavior may be overridden in inheriting Recognizers
	     * for example: One may decide that only punctuation tokens may be inserted automatically as they have no additional
	     * semantic value. (A mandatory semicolon has no additional semantic meaning, but an Integer may have additional meaning
	     * depending on its int value and context (Inserting an integer 0 in cardinality: "[1..]" will cause semantic issues
	     * as the max of the cardinality will be greater than the min value. (and this is a false error!)
	     */
	    Parser.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
	        return true;
	    };
	    Parser.prototype.defaultInvalidReturn = function () { return undefined; };
	    Parser.prototype.tryInRepetitionRecovery = function (grammarRule, grammarRuleArgs, lookAheadFunc, expectedTokType) {
	        var _this = this;
	        // TODO: can the resyncTokenType be cached?
	        var reSyncTokType = this.findReSyncTokenType();
	        var orgInputIdx = this.inputIdx;
	        var nextTokenWithoutResync = this.NEXT_TOKEN();
	        var currToken = this.NEXT_TOKEN();
	        var passedResyncPoint = false;
	        var generateErrorMessage = function () {
	            // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
	            // the error that would have been thrown
	            var expectedTokName = tokens_public_1.tokenName(expectedTokType);
	            var msg = "Expecting token of type -->" + expectedTokName +
	                "<-- but found -->'" + nextTokenWithoutResync.image + "'<--";
	            _this.SAVE_ERROR(new exceptions_public_1.exceptions.MismatchedTokenException(msg, nextTokenWithoutResync));
	        };
	        while (!passedResyncPoint) {
	            // re-synced to a point where we can safely exit the repetition/
	            if (currToken instanceof expectedTokType) {
	                generateErrorMessage();
	                return; // must return here to avoid reverting the inputIdx
	            }
	            // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
	            if (lookAheadFunc.call(this)) {
	                generateErrorMessage();
	                // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
	                grammarRule.apply(this, grammarRuleArgs);
	                return; // must return here to avoid reverting the inputIdx
	            }
	            if (currToken instanceof reSyncTokType) {
	                passedResyncPoint = true;
	            }
	            currToken = this.SKIP_TOKEN();
	        }
	        // we were unable to find a CLOSER point to resync inside the MANY, reset the state and
	        // rethrow the exception for farther recovery attempts into rules deeper in the rules stack
	        this.inputIdx = orgInputIdx;
	    };
	    Parser.prototype.shouldInRepetitionRecoveryBeTried = function (expectTokAfterLastMatch, nextTokIdx) {
	        // arguments to try and perform resync into the next iteration of the many are missing
	        if (expectTokAfterLastMatch === undefined || nextTokIdx === undefined) {
	            return false;
	        }
	        // no need to recover, next token is what we expect...
	        if (this.NEXT_TOKEN() instanceof expectTokAfterLastMatch) {
	            return false;
	        }
	        // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
	        // and prefer some backtracking path that includes recovered errors.
	        if (this.isBackTracking()) {
	            return false;
	        }
	        // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
	        // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
	        //noinspection RedundantIfStatementJS
	        if (this.canPerformInRuleRecovery(expectTokAfterLastMatch, this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx))) {
	            return false;
	        }
	        return true;
	    };
	    // Error Recovery functionality
	    Parser.prototype.getFollowsForInRuleRecovery = function (tokClass, tokIdxInRule) {
	        var pathRuleStack = utils_1.cloneArr(this.RULE_STACK);
	        var pathOccurrenceStack = utils_1.cloneArr(this.RULE_OCCURRENCE_STACK);
	        var grammarPath = {
	            ruleStack: pathRuleStack,
	            occurrenceStack: pathOccurrenceStack,
	            lastTok: tokClass,
	            lastTokOccurrence: tokIdxInRule
	        };
	        var topRuleName = utils_1.first(pathRuleStack);
	        var gastProductions = this.getGAstProductions();
	        var topProduction = gastProductions.get(topRuleName);
	        var follows = new interpreter_1.NextAfterTokenWalker(topProduction, grammarPath).startWalking();
	        return follows;
	    };
	    Parser.prototype.tryInRuleRecovery = function (expectedTokType, follows) {
	        if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
	            var tokToInsert = this.getTokenToInsert(expectedTokType);
	            tokToInsert.isInsertedInRecovery = true;
	            return tokToInsert;
	        }
	        if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
	            var nextTok = this.SKIP_TOKEN();
	            this.inputIdx++;
	            return nextTok;
	        }
	        throw new InRuleRecoveryException("sad sad panda");
	    };
	    Parser.prototype.canPerformInRuleRecovery = function (expectedToken, follows) {
	        return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
	            this.canRecoverWithSingleTokenDeletion(expectedToken);
	    };
	    Parser.prototype.canRecoverWithSingleTokenInsertion = function (expectedTokType, follows) {
	        if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
	            return false;
	        }
	        // must know the possible following tokens to perform single token insertion
	        if (utils_1.isEmpty(follows)) {
	            return false;
	        }
	        var mismatchedTok = this.NEXT_TOKEN();
	        var isMisMatchedTokInFollows = utils_1.find(follows, function (possibleFollowsTokType) {
	            return mismatchedTok instanceof possibleFollowsTokType;
	        }) !== undefined;
	        return isMisMatchedTokInFollows;
	    };
	    Parser.prototype.canRecoverWithSingleTokenDeletion = function (expectedTokType) {
	        var isNextTokenWhatIsExpected = this.LA(2) instanceof expectedTokType;
	        return isNextTokenWhatIsExpected;
	    };
	    Parser.prototype.isInCurrentRuleReSyncSet = function (token) {
	        var followKey = this.getCurrFollowKey();
	        var currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey);
	        return utils_1.contains(currentRuleReSyncSet, token);
	    };
	    Parser.prototype.findReSyncTokenType = function () {
	        var allPossibleReSyncTokTypes = this.flattenFollowSet();
	        // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
	        var nextToken = this.NEXT_TOKEN();
	        var k = 2;
	        while (true) {
	            var nextTokenType = nextToken.constructor;
	            if (utils_1.contains(allPossibleReSyncTokTypes, nextTokenType)) {
	                return nextTokenType;
	            }
	            nextToken = this.LA(k);
	            k++;
	        }
	    };
	    Parser.prototype.getCurrFollowKey = function () {
	        // the length is at least one as we always add the ruleName to the stack before invoking the rule.
	        if (this.RULE_STACK.length === 1) {
	            return EOF_FOLLOW_KEY;
	        }
	        var currRuleIdx = this.RULE_STACK.length - 1;
	        var currRuleOccIdx = currRuleIdx;
	        var prevRuleIdx = currRuleIdx - 1;
	        return {
	            ruleName: this.RULE_STACK[currRuleIdx],
	            idxInCallingRule: this.RULE_OCCURRENCE_STACK[currRuleOccIdx],
	            inRule: this.RULE_STACK[prevRuleIdx]
	        };
	    };
	    Parser.prototype.buildFullFollowKeyStack = function () {
	        var _this = this;
	        return utils_1.map(this.RULE_STACK, function (ruleName, idx) {
	            if (idx === 0) {
	                return EOF_FOLLOW_KEY;
	            }
	            return {
	                ruleName: ruleName,
	                idxInCallingRule: _this.RULE_OCCURRENCE_STACK[idx],
	                inRule: _this.RULE_STACK[idx - 1]
	            };
	        });
	    };
	    Parser.prototype.flattenFollowSet = function () {
	        var _this = this;
	        var followStack = utils_1.map(this.buildFullFollowKeyStack(), function (currKey) {
	            return _this.getFollowSetFromFollowKey(currKey);
	        });
	        return utils_1.flatten(followStack);
	    };
	    Parser.prototype.getFollowSetFromFollowKey = function (followKey) {
	        if (followKey === EOF_FOLLOW_KEY) {
	            return [tokens_public_1.EOF];
	        }
	        var followName = followKey.ruleName + followKey.idxInCallingRule + constants_1.IN + followKey.inRule;
	        return cache.getResyncFollowsForClass(this.className).get(followName);
	    };
	    Parser.prototype.reSyncTo = function (tokClass) {
	        var nextTok = this.NEXT_TOKEN();
	        while ((nextTok instanceof tokClass) === false) {
	            nextTok = this.SKIP_TOKEN();
	        }
	    };
	    Parser.prototype.attemptInRepetitionRecovery = function (prodFunc, args, lookaheadFunc, prodName, prodOccurrence, nextToksWalker, prodKeys) {
	        var key = this.getKeyForAutomaticLookahead(prodName, prodKeys, prodOccurrence);
	        var firstAfterRepInfo = this.firstAfterRepMap.get(key);
	        if (firstAfterRepInfo === undefined) {
	            var currRuleName = utils_1.last(this.RULE_STACK);
	            var ruleGrammar = this.getGAstProductions().get(currRuleName);
	            var walker = new nextToksWalker(ruleGrammar, prodOccurrence);
	            firstAfterRepInfo = walker.startWalking();
	            this.firstAfterRepMap.put(key, firstAfterRepInfo);
	        }
	        var expectTokAfterLastMatch = firstAfterRepInfo.token;
	        var nextTokIdx = firstAfterRepInfo.occurrence;
	        var isEndOfRule = firstAfterRepInfo.isEndOfRule;
	        // special edge case of a TOP most repetition after which the input should END.
	        // this will force an attempt for inRule recovery in that scenario.
	        if (this.RULE_STACK.length === 1 &&
	            isEndOfRule &&
	            expectTokAfterLastMatch === undefined) {
	            expectTokAfterLastMatch = tokens_public_1.EOF;
	            nextTokIdx = 1;
	        }
	        if (this.shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch, nextTokIdx)) {
	            // TODO: performance optimization: instead of passing the original args here, we modify
	            // the args param (or create a new one) and make sure the lookahead func is explicitly provided
	            // to avoid searching the cache for it once more.
	            this.tryInRepetitionRecovery(prodFunc, args, lookaheadFunc, expectTokAfterLastMatch);
	        }
	    };
	    // Implementation of parsing DSL
	    Parser.prototype.optionInternal = function (condition, action) {
	        if (condition.call(this)) {
	            action.call(this);
	            return true;
	        }
	        return false;
	    };
	    Parser.prototype.atLeastOneInternal = function (prodFunc, prodName, prodOccurrence, lookAheadFunc, action, errMsg) {
	        if (utils_1.isString(action)) {
	            errMsg = action;
	            action = lookAheadFunc;
	            lookAheadFunc = this.getLookaheadFuncForAtLeastOne(prodOccurrence);
	        }
	        if (lookAheadFunc.call(this)) {
	            action.call(this);
	            while (lookAheadFunc.call(this)) {
	                action.call(this);
	            }
	        }
	        else {
	            throw this.SAVE_ERROR(new exceptions_public_1.exceptions.EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()));
	        }
	        // note that while it may seem that this can cause an error because by using a recursive call to
	        // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
	        // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.
	        if (this.isErrorRecoveryEnabled) {
	            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action, errMsg], lookAheadFunc, prodName, prodOccurrence, interpreter_1.NextTerminalAfterAtLeastOneWalker, this.atLeastOneLookaheadKeys);
	        }
	    };
	    Parser.prototype.atLeastOneSepFirstInternal = function (prodFunc, prodName, prodOccurrence, separator, firstIterationLookAheadFunc, action, errMsg) {
	        var _this = this;
	        var separatorsResult = [];
	        if (utils_1.isString(action)) {
	            errMsg = action;
	            action = firstIterationLookAheadFunc;
	            firstIterationLookAheadFunc = this.getLookaheadFuncForAtLeastOneSep(prodOccurrence);
	        }
	        // 1st iteration
	        if (firstIterationLookAheadFunc.call(this)) {
	            action.call(this);
	            var separatorLookAheadFunc = function () { return _this.NEXT_TOKEN() instanceof separator; };
	            // 2nd..nth iterations
	            while (separatorLookAheadFunc()) {
	                // note that this CONSUME will never enter recovery because
	                // the separatorLookAheadFunc checks that the separator really does exist.
	                separatorsResult.push(this.CONSUME(separator));
	                action.call(this);
	            }
	            if (this.isErrorRecoveryEnabled) {
	                this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult,
	                    this.atLeastOneSepLookaheadKeys, interpreter_1.NextTerminalAfterAtLeastOneSepWalker], separatorLookAheadFunc, prodName, prodOccurrence, interpreter_1.NextTerminalAfterAtLeastOneSepWalker, this.atLeastOneSepLookaheadKeys);
	            }
	        }
	        else {
	            throw this.SAVE_ERROR(new exceptions_public_1.exceptions.EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()));
	        }
	        return separatorsResult;
	    };
	    Parser.prototype.manyInternal = function (prodFunc, prodName, prodOccurrence, lookAheadFunc, action) {
	        if (action === undefined) {
	            action = lookAheadFunc;
	            lookAheadFunc = this.getLookaheadFuncForMany(prodOccurrence);
	        }
	        while (lookAheadFunc.call(this)) {
	            action.call(this);
	        }
	        if (this.isErrorRecoveryEnabled) {
	            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action], lookAheadFunc, prodName, prodOccurrence, interpreter_1.NextTerminalAfterManyWalker, this.manyLookaheadKeys);
	        }
	    };
	    Parser.prototype.manySepFirstInternal = function (prodFunc, prodName, prodOccurrence, separator, firstIterationLookAheadFunc, action) {
	        var _this = this;
	        var separatorsResult = [];
	        if (action === undefined) {
	            action = firstIterationLookAheadFunc;
	            firstIterationLookAheadFunc = this.getLookaheadFuncForManySep(prodOccurrence);
	        }
	        // 1st iteration
	        if (firstIterationLookAheadFunc.call(this)) {
	            action.call(this);
	            var separatorLookAheadFunc = function () { return _this.NEXT_TOKEN() instanceof separator; };
	            // 2nd..nth iterations
	            while (separatorLookAheadFunc()) {
	                // note that this CONSUME will never enter recovery because
	                // the separatorLookAheadFunc checks that the separator really does exist.
	                separatorsResult.push(this.CONSUME(separator));
	                action.call(this);
	            }
	            if (this.isErrorRecoveryEnabled) {
	                this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult,
	                    this.manySepLookaheadKeys, interpreter_1.NextTerminalAfterManySepWalker], separatorLookAheadFunc, prodName, prodOccurrence, interpreter_1.NextTerminalAfterManySepWalker, this.manySepLookaheadKeys);
	            }
	        }
	        return separatorsResult;
	    };
	    Parser.prototype.repetitionSepSecondInternal = function (prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult, laKeys, nextTerminalAfterWalker) {
	        while (separatorLookAheadFunc()) {
	            // note that this CONSUME will never enter recovery because
	            // the separatorLookAheadFunc checks that the separator really does exist.
	            separatorsResult.push(this.CONSUME(separator));
	            action.call(this);
	        }
	        // we can only arrive to this function after an error
	        // has occurred (hence the name 'second') so the following
	        // IF will always be entered, its possible to remove it...
	        // however it is kept to avoid confusion and be consistent.
	        /* istanbul ignore else */
	        if (this.isErrorRecoveryEnabled) {
	            this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [prodName, prodOccurrence, separator, separatorLookAheadFunc,
	                action, separatorsResult, laKeys, nextTerminalAfterWalker], separatorLookAheadFunc, prodName, prodOccurrence, nextTerminalAfterWalker, laKeys);
	        }
	    };
	    Parser.prototype.orInternal = function (alts, errMsgTypes, occurrence, ignoreAmbiguities) {
	        // explicit alternatives look ahead
	        if (alts[0].WHEN !== undefined) {
	            for (var i = 0; i < alts.length; i++) {
	                if (alts[i].WHEN.call(this)) {
	                    var res = alts[i].THEN_DO();
	                    return res;
	                }
	            }
	            this.raiseNoAltException(occurrence, errMsgTypes);
	        }
	        // else implicit lookahead
	        var laFunc = this.getLookaheadFuncForOr(occurrence, ignoreAmbiguities);
	        var altToTake = laFunc.call(this);
	        if (altToTake !== -1) {
	            return alts[altToTake].ALT.call(this);
	        }
	        this.raiseNoAltException(occurrence, errMsgTypes);
	    };
	    /**
	     * @param tokClass The Type of Token we wish to consume (Reference to its constructor function)
	     * @param idx occurrence index of consumed token in the invoking parser rule text
	     *         for example:
	     *         IDENT (DOT IDENT)*
	     *         the first ident will have idx 1 and the second one idx 2
	     *         * note that for the second ident the idx is always 2 even if its invoked 30 times in the same rule
	     *           the idx is about the position in grammar (source code) and has nothing to do with a specific invocation
	     *           details
	     *
	     * @returns the consumed Token
	     */
	    Parser.prototype.consumeInternal = function (tokClass, idx) {
	        try {
	            return this.consumeInternalOptimized(tokClass);
	        }
	        catch (eFromConsumption) {
	            // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
	            // but the original syntax could have been parsed successfully without any backtracking + recovery
	            if (this.isErrorRecoveryEnabled &&
	                eFromConsumption instanceof exceptions_public_1.exceptions.MismatchedTokenException && !this.isBackTracking()) {
	                var follows = this.getFollowsForInRuleRecovery(tokClass, idx);
	                try {
	                    return this.tryInRuleRecovery(tokClass, follows);
	                }
	                catch (eFromInRuleRecovery) {
	                    if (eFromInRuleRecovery.name === lang_extensions_1.functionName(InRuleRecoveryException)) {
	                        // failed in RuleRecovery.
	                        // throw the original error in order to trigger reSync error recovery
	                        throw eFromConsumption;
	                    }
	                    else {
	                        throw eFromInRuleRecovery;
	                    }
	                }
	            }
	            else {
	                throw eFromConsumption;
	            }
	        }
	    };
	    // to enable optimizations this logic has been extract to a method as its invoker contains try/catch
	    Parser.prototype.consumeInternalOptimized = function (tokClass) {
	        var nextToken = this.NEXT_TOKEN();
	        if (this.NEXT_TOKEN() instanceof tokClass) {
	            this.inputIdx++;
	            return nextToken;
	        }
	        else {
	            var expectedTokType = tokens_public_1.tokenName(tokClass);
	            var msg = "Expecting token of type -->" + expectedTokType + "<-- but found -->'" + nextToken.image + "'<--";
	            throw this.SAVE_ERROR(new exceptions_public_1.exceptions.MismatchedTokenException(msg, nextToken));
	        }
	    };
	    Parser.prototype.getKeyForAutomaticLookahead = function (prodName, prodKeys, occurrence) {
	        var occuMap = prodKeys[occurrence - 1];
	        var currRule = utils_1.last(this.RULE_STACK);
	        var key = occuMap[currRule];
	        if (key === undefined) {
	            key = prodName + occurrence + constants_1.IN + currRule;
	            occuMap[currRule] = key;
	        }
	        return key;
	    };
	    // Automatic lookahead calculation
	    Parser.prototype.getLookaheadFuncForOption = function (occurence) {
	        var key = this.getKeyForAutomaticLookahead("OPTION", this.optionLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForOption);
	    };
	    Parser.prototype.getLookaheadFuncForOr = function (occurence, ignoreErrors) {
	        var key = this.getKeyForAutomaticLookahead("OR", this.orLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForOr, [ignoreErrors]);
	    };
	    Parser.prototype.getLookaheadFuncForMany = function (occurence) {
	        var key = this.getKeyForAutomaticLookahead("MANY", this.manyLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForMany);
	    };
	    Parser.prototype.getLookaheadFuncForManySep = function (occurence) {
	        var key = this.getKeyForAutomaticLookahead("MANY_SEP", this.manySepLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForManySep);
	    };
	    Parser.prototype.getLookaheadFuncForAtLeastOne = function (occurence) {
	        var key = this.getKeyForAutomaticLookahead("AT_LEAST_ONE", this.atLeastOneLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForAtLeastOne);
	    };
	    Parser.prototype.getLookaheadFuncForAtLeastOneSep = function (occurence) {
	        var key = this.getKeyForAutomaticLookahead("AT_LEAST_ONE_SEP", this.atLeastOneSepLookaheadKeys, occurence);
	        return this.getLookaheadFuncFor(key, occurence, lookahead_1.buildLookaheadForAtLeastOneSep);
	    };
	    Parser.prototype.getLookaheadFuncFor = function (key, occurrence, laFuncBuilder, extraArgs) {
	        if (extraArgs === void 0) { extraArgs = []; }
	        var ruleName = utils_1.last(this.RULE_STACK);
	        var condition = this.classLAFuncs.get(key);
	        if (condition === undefined) {
	            var ruleGrammar = this.getGAstProductions().get(ruleName);
	            condition = laFuncBuilder.apply(null, [occurrence, ruleGrammar].concat(extraArgs));
	            this.classLAFuncs.put(key, condition);
	        }
	        return condition;
	    };
	    // other functionality
	    Parser.prototype.saveRecogState = function () {
	        var savedErrors = utils_1.cloneArr(this.errors);
	        var savedRuleStack = utils_1.cloneArr(this.RULE_STACK);
	        return {
	            errors: savedErrors,
	            inputIdx: this.inputIdx,
	            RULE_STACK: savedRuleStack
	        };
	    };
	    Parser.prototype.reloadRecogState = function (newState) {
	        this.errors = newState.errors;
	        this.inputIdx = newState.inputIdx;
	        this.RULE_STACK = newState.RULE_STACK;
	    };
	    Parser.prototype.raiseNoAltException = function (occurrence, errMsgTypes) {
	        var errSuffix = " but found: '" + this.NEXT_TOKEN().image + "'";
	        if (errMsgTypes === undefined) {
	            var ruleName = utils_1.last(this.RULE_STACK);
	            var ruleGrammar = this.getGAstProductions().get(ruleName);
	            var nextTokens = new interpreter_1.NextInsideOrWalker(ruleGrammar, occurrence).startWalking();
	            var nextTokensFlat = utils_1.flatten(nextTokens);
	            var nextTokensNames = utils_1.map(nextTokensFlat, function (currTokenClass) { return tokens_public_1.tokenName(currTokenClass); });
	            errMsgTypes = "one of: <" + nextTokensNames.join(" ,") + ">";
	        }
	        throw this.SAVE_ERROR(new exceptions_public_1.exceptions.NoViableAltException("expecting: " + errMsgTypes + " " + errSuffix, this.NEXT_TOKEN()));
	    };
	    Parser.IGNORE_AMBIGUITIES = true;
	    Parser.NO_RESYNC = false;
	    // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
	    // (normally during the parser's constructor).
	    // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
	    // for example: duplicate rule names, referencing an unresolved subrule, ect...
	    // This flag should not be enabled during normal usage, it is used in special situations, for example when
	    // needing to display the parser definition errors in some GUI(online playground).
	    Parser.DEFER_DEFINITION_ERRORS_HANDLING = false;
	    return Parser;
	}());
	exports.Parser = Parser;
	function InRuleRecoveryException(message) {
	    this.name = lang_extensions_1.functionName(InRuleRecoveryException);
	    this.message = message;
	}
	InRuleRecoveryException.prototype = Error.prototype;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * module used to cache static information about parsers,
	 */
	"use strict";
	var lang_extensions_1 = __webpack_require__(3);
	var utils_1 = __webpack_require__(4);
	exports.CLASS_TO_DEFINITION_ERRORS = new lang_extensions_1.HashTable();
	exports.CLASS_TO_SELF_ANALYSIS_DONE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_GRAMMAR_PRODUCTIONS = new lang_extensions_1.HashTable();
	function getProductionsForClass(className) {
	    return getFromNestedHashTable(className, exports.CLASS_TO_GRAMMAR_PRODUCTIONS);
	}
	exports.getProductionsForClass = getProductionsForClass;
	exports.CLASS_TO_RESYNC_FOLLOW_SETS = new lang_extensions_1.HashTable();
	function getResyncFollowsForClass(className) {
	    return getFromNestedHashTable(className, exports.CLASS_TO_RESYNC_FOLLOW_SETS);
	}
	exports.getResyncFollowsForClass = getResyncFollowsForClass;
	function setResyncFollowsForClass(className, followSet) {
	    exports.CLASS_TO_RESYNC_FOLLOW_SETS.put(className, followSet);
	}
	exports.setResyncFollowsForClass = setResyncFollowsForClass;
	exports.CLASS_TO_LOOKAHEAD_FUNCS = new lang_extensions_1.HashTable();
	function getLookaheadFuncsForClass(className) {
	    return getFromNestedHashTable(className, exports.CLASS_TO_LOOKAHEAD_FUNCS);
	}
	exports.getLookaheadFuncsForClass = getLookaheadFuncsForClass;
	exports.CLASS_TO_FIRST_AFTER_REPETITION = new lang_extensions_1.HashTable();
	function getFirstAfterRepForClass(className) {
	    return getFromNestedHashTable(className, exports.CLASS_TO_FIRST_AFTER_REPETITION);
	}
	exports.getFirstAfterRepForClass = getFirstAfterRepForClass;
	exports.CLASS_TO_OR_LA_CACHE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_MANY_LA_CACHE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_MANY_SEP_LA_CACHE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_AT_LEAST_ONE_LA_CACHE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_AT_LEAST_ONE_SEP_LA_CACHE = new lang_extensions_1.HashTable();
	exports.CLASS_TO_OPTION_LA_CACHE = new lang_extensions_1.HashTable();
	// TODO: CONST in typescript 1.5
	// TODO reflective test to verify this has not changed, for example (OPTION6 added)
	exports.MAX_OCCURRENCE_INDEX = 5;
	function initLookAheadKeyCache(className) {
	    exports.CLASS_TO_OR_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    exports.CLASS_TO_MANY_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    exports.CLASS_TO_MANY_SEP_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    exports.CLASS_TO_AT_LEAST_ONE_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    exports.CLASS_TO_AT_LEAST_ONE_SEP_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    exports.CLASS_TO_OPTION_LA_CACHE[className] = new Array(exports.MAX_OCCURRENCE_INDEX);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_OR_LA_CACHE[className]);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_MANY_LA_CACHE[className]);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_MANY_SEP_LA_CACHE[className]);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_AT_LEAST_ONE_LA_CACHE[className]);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_AT_LEAST_ONE_SEP_LA_CACHE[className]);
	    initSingleLookAheadKeyCache(exports.CLASS_TO_OPTION_LA_CACHE[className]);
	}
	exports.initLookAheadKeyCache = initLookAheadKeyCache;
	function initSingleLookAheadKeyCache(laCache) {
	    for (var i = 0; i < exports.MAX_OCCURRENCE_INDEX; i++) {
	        laCache[i] = new lang_extensions_1.HashTable();
	    }
	}
	function getFromNestedHashTable(className, hashTable) {
	    var result = hashTable.get(className);
	    if (result === undefined) {
	        hashTable.put(className, new lang_extensions_1.HashTable());
	        result = hashTable.get(className);
	    }
	    return result;
	}
	function clearCache() {
	    var hasTables = utils_1.filter(utils_1.values(module.exports), function (currHashTable) { return currHashTable instanceof lang_extensions_1.HashTable; });
	    utils_1.forEach(hasTables, function (currHashTable) { return currHashTable.clear(); });
	}
	exports.clearCache = clearCache;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var utils = __webpack_require__(4);
	var nameRegex = /^\s*function\s*(\S*)\s*\(/;
	/* istanbul ignore next */
	var hasNativeName = typeof (function f() { }).name !== "undefined";
	function classNameFromInstance(instance) {
	    return functionName(instance.constructor);
	}
	exports.classNameFromInstance = classNameFromInstance;
	/* istanbul ignore next too many hacks for IE here*/
	function functionName(func) {
	    if (hasNativeName) {
	        return func.name;
	    }
	    else if (func.rdtFuncNameCache666) {
	        // super 'special' property name on INSTANCE to avoid hurting those who use browsers that
	        // do not support name property even more (IE...)
	        return func.rdtFuncNameCache666;
	    }
	    else {
	        var name_1 = func.toString().match(nameRegex)[1];
	        func.rdtFuncNameCache666 = name_1;
	        return name_1;
	    }
	}
	exports.functionName = functionName;
	/**
	 * simple Hashtable between a string and some generic value
	 * this should be removed once typescript supports ES6 style Hashtable
	 */
	var HashTable = (function () {
	    function HashTable() {
	        this._state = {};
	    }
	    HashTable.prototype.keys = function () {
	        return utils.keys(this._state);
	    };
	    HashTable.prototype.values = function () {
	        return utils.values(this._state);
	    };
	    HashTable.prototype.put = function (key, value) {
	        this._state[key] = value;
	    };
	    HashTable.prototype.putAll = function (other) {
	        this._state = utils.assign(this._state, other._state);
	    };
	    HashTable.prototype.get = function (key) {
	        // To avoid edge case with a key called "hasOwnProperty" we need to perform the commented out check below
	        // -> if (Object.prototype.hasOwnProperty.call(this._state, key)) { ... } <-
	        // however this costs nearly 25% of the parser's runtime.
	        // if someone decides to name their Parser class "hasOwnProperty" they deserve what they will get :)
	        return this._state[key];
	    };
	    HashTable.prototype.containsKey = function (key) {
	        return utils.has(this._state, key);
	    };
	    HashTable.prototype.clear = function () {
	        this._state = {};
	    };
	    return HashTable;
	}());
	exports.HashTable = HashTable;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	/*
	 Utils using lodash style API. (not necessarily 100% compliant) for functional and other utils.
	 These utils should replace usage of lodash in the production code base. not because they are any better...
	 but for the purpose of being a dependency free library.

	 The hotspots in the code are already written in imperative style for performance reasons.
	 so writing several dozen utils which may be slower than the original lodash, does not matter as much
	 considering they will not be invoked in hotspots...
	 */
	function isEmpty(arr) {
	    return arr && arr.length === 0;
	}
	exports.isEmpty = isEmpty;
	function keys(obj) {
	    return Object.keys(obj);
	}
	exports.keys = keys;
	function values(obj) {
	    var vals = [];
	    var keys = Object.keys(obj);
	    for (var i = 0; i < keys.length; i++) {
	        vals.push(obj[keys[i]]);
	    }
	    return vals;
	}
	exports.values = values;
	function map(arr, callback) {
	    var result = [];
	    for (var idx = 0; idx < arr.length; idx++) {
	        result.push(callback.call(null, arr[idx], idx));
	    }
	    return result;
	}
	exports.map = map;
	function flatten(arr) {
	    var result = [];
	    for (var idx = 0; idx < arr.length; idx++) {
	        var currItem = arr[idx];
	        if (Array.isArray(currItem)) {
	            result = result.concat(flatten(currItem));
	        }
	        else {
	            result.push(currItem);
	        }
	    }
	    return result;
	}
	exports.flatten = flatten;
	function first(arr) {
	    return isEmpty(arr) ? undefined : arr[0];
	}
	exports.first = first;
	function last(arr) {
	    var len = arr && arr.length;
	    return len ? arr[len - 1] : undefined;
	}
	exports.last = last;
	function forEach(arr, iteratorCallback) {
	    if (Array.isArray(arr)) {
	        for (var i = 0; i < arr.length; i++) {
	            iteratorCallback.call(null, arr[i], i);
	        }
	    }
	}
	exports.forEach = forEach;
	function isString(item) {
	    return typeof item === "string";
	}
	exports.isString = isString;
	function isUndefined(item) {
	    return item === undefined;
	}
	exports.isUndefined = isUndefined;
	function isFunction(item) {
	    return item instanceof Function;
	}
	exports.isFunction = isFunction;
	function drop(arr, howMuch) {
	    if (howMuch === void 0) { howMuch = 1; }
	    return arr.slice(howMuch, arr.length);
	}
	exports.drop = drop;
	function dropRight(arr, howMuch) {
	    if (howMuch === void 0) { howMuch = 1; }
	    return arr.slice(0, arr.length - howMuch);
	}
	exports.dropRight = dropRight;
	function filter(arr, predicate) {
	    var result = [];
	    if (Array.isArray(arr)) {
	        for (var i = 0; i < arr.length; i++) {
	            var item = arr[i];
	            if (predicate.call(null, item)) {
	                result.push(item);
	            }
	        }
	    }
	    return result;
	}
	exports.filter = filter;
	function reject(arr, predicate) {
	    return filter(arr, function (item) { return !predicate(item); });
	}
	exports.reject = reject;
	function pick(obj, predicate) {
	    var keys = Object.keys(obj);
	    var result = {};
	    for (var i = 0; i < keys.length; i++) {
	        var currKey = keys[i];
	        var currItem = obj[currKey];
	        if (predicate(currItem)) {
	            result[currKey] = currItem;
	        }
	    }
	    return result;
	}
	exports.pick = pick;
	function has(obj, prop) {
	    return obj.hasOwnProperty(prop);
	}
	exports.has = has;
	function contains(arr, item) {
	    return find(arr, function (currItem) { return currItem === item; }) !== undefined ? true : false;
	}
	exports.contains = contains;
	/**
	 * shallow clone
	 */
	function cloneArr(arr) {
	    return map(arr, function (item) { return item; });
	}
	exports.cloneArr = cloneArr;
	/**
	 * shallow clone
	 */
	function cloneObj(obj) {
	    var clonedObj = {};
	    for (var key in obj) {
	        /* istanbul ignore else */
	        if (Object.prototype.hasOwnProperty.call(obj, key)) {
	            clonedObj[key] = obj[key];
	        }
	    }
	    return clonedObj;
	}
	exports.cloneObj = cloneObj;
	function find(arr, predicate) {
	    for (var i = 0; i < arr.length; i++) {
	        var item = arr[i];
	        if (predicate.call(null, item)) {
	            return item;
	        }
	    }
	    return undefined;
	}
	exports.find = find;
	function reduce(arrOrObj, iterator, initial) {
	    var vals = Array.isArray(arrOrObj) ? arrOrObj : values(arrOrObj);
	    var accumulator = initial;
	    for (var i = 0; i < vals.length; i++) {
	        accumulator = iterator.call(null, accumulator, vals[i]);
	    }
	    return accumulator;
	}
	exports.reduce = reduce;
	function compact(arr) {
	    return reject(arr, function (item) { return item === null || item === undefined; });
	}
	exports.compact = compact;
	function uniq(arr, identity) {
	    if (identity === void 0) { identity = function (item) { return item; }; }
	    var identities = [];
	    return reduce(arr, function (result, currItem) {
	        var currIdentity = identity(currItem);
	        if (contains(identities, currIdentity)) {
	            return result;
	        }
	        else {
	            identities.push(currIdentity);
	            return result.concat(currItem);
	        }
	    }, []);
	}
	exports.uniq = uniq;
	function partial(func) {
	    var restArgs = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        restArgs[_i - 1] = arguments[_i];
	    }
	    var firstArg = [null];
	    var allArgs = firstArg.concat(restArgs);
	    return Function.bind.apply(func, allArgs);
	}
	exports.partial = partial;
	function isArray(obj) {
	    return Array.isArray(obj);
	}
	exports.isArray = isArray;
	function isRegExp(obj) {
	    return obj instanceof RegExp;
	}
	exports.isRegExp = isRegExp;
	function isObject(obj) {
	    return obj instanceof Object;
	}
	exports.isObject = isObject;
	function every(arr, predicate) {
	    for (var i = 0; i < arr.length; i++) {
	        if (!predicate(arr[i])) {
	            return false;
	        }
	    }
	    return true;
	}
	exports.every = every;
	function difference(arr, values) {
	    return reject(arr, function (item) { return contains(values, item); });
	}
	exports.difference = difference;
	function some(arr, predicate) {
	    for (var i = 0; i < arr.length; i++) {
	        if (predicate(arr[i])) {
	            return true;
	        }
	    }
	    return false;
	}
	exports.some = some;
	function indexOf(arr, value) {
	    for (var i = 0; i < arr.length; i++) {
	        if (arr[i] === value) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.indexOf = indexOf;
	function sortBy(arr, orderFunc) {
	    var result = cloneArr(arr);
	    result.sort(function (a, b) { return orderFunc(a) - orderFunc(b); });
	    return result;
	}
	exports.sortBy = sortBy;
	function zipObject(keys, values) {
	    if (keys.length !== values.length) {
	        throw Error("can't zipObject with different number of keys and values!");
	    }
	    var result = {};
	    for (var i = 0; i < keys.length; i++) {
	        result[keys[i]] = values[i];
	    }
	    return result;
	}
	exports.zipObject = zipObject;
	/**
	 * mutates! (and returns) target
	 */
	function assign(target) {
	    var sources = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        sources[_i - 1] = arguments[_i];
	    }
	    for (var i = 0; i < sources.length; i++) {
	        var curSource = sources[i];
	        var currSourceKeys = keys(curSource);
	        for (var j = 0; j < currSourceKeys.length; j++) {
	            var currKey = currSourceKeys[j];
	            target[currKey] = curSource[currKey];
	        }
	    }
	    return target;
	}
	exports.assign = assign;
	function groupBy(arr, groupKeyFunc) {
	    var result = {};
	    forEach(arr, function (item) {
	        var currGroupKey = groupKeyFunc(item);
	        var currGroupArr = result[currGroupKey];
	        if (currGroupArr) {
	            currGroupArr.push(item);
	        }
	        else {
	            result[currGroupKey] = [item];
	        }
	    });
	    return result;
	}
	exports.groupBy = groupBy;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var lang_extensions_1 = __webpack_require__(3);
	var utils_1 = __webpack_require__(4);
	var exceptions;
	(function (exceptions) {
	    // hacks to bypass no support for custom Errors in javascript/typescript
	    function isRecognitionException(error) {
	        var recognitionExceptions = [
	            lang_extensions_1.functionName(MismatchedTokenException),
	            lang_extensions_1.functionName(NoViableAltException),
	            lang_extensions_1.functionName(EarlyExitException),
	            lang_extensions_1.functionName(NotAllInputParsedException)];
	        // can't do instanceof on hacked custom js exceptions
	        return utils_1.contains(recognitionExceptions, error.name);
	    }
	    exceptions.isRecognitionException = isRecognitionException;
	    function MismatchedTokenException(message, token) {
	        this.name = lang_extensions_1.functionName(MismatchedTokenException);
	        this.message = message;
	        this.token = token;
	    }
	    exceptions.MismatchedTokenException = MismatchedTokenException;
	    // must use the "Error.prototype" instead of "new Error"
	    // because the stack trace points to where "new Error" was invoked"
	    MismatchedTokenException.prototype = Error.prototype;
	    function NoViableAltException(message, token) {
	        this.name = lang_extensions_1.functionName(NoViableAltException);
	        this.message = message;
	        this.token = token;
	    }
	    exceptions.NoViableAltException = NoViableAltException;
	    NoViableAltException.prototype = Error.prototype;
	    function NotAllInputParsedException(message, token) {
	        this.name = lang_extensions_1.functionName(NotAllInputParsedException);
	        this.message = message;
	        this.token = token;
	    }
	    exceptions.NotAllInputParsedException = NotAllInputParsedException;
	    NotAllInputParsedException.prototype = Error.prototype;
	    function EarlyExitException(message, token) {
	        this.name = lang_extensions_1.functionName(EarlyExitException);
	        this.message = message;
	        this.token = token;
	    }
	    exceptions.EarlyExitException = EarlyExitException;
	    EarlyExitException.prototype = Error.prototype;
	})(exceptions = exports.exceptions || (exports.exceptions = {}));


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var parser_public_1 = __webpack_require__(1);
	var gast_public_1 = __webpack_require__(7);
	var utils_1 = __webpack_require__(4);
	function resolveGrammar(topLevels) {
	    var refResolver = new GastRefResolverVisitor(topLevels);
	    refResolver.resolveRefs();
	    return refResolver.errors;
	}
	exports.resolveGrammar = resolveGrammar;
	var GastRefResolverVisitor = (function (_super) {
	    __extends(GastRefResolverVisitor, _super);
	    function GastRefResolverVisitor(nameToTopRule) {
	        _super.call(this);
	        this.nameToTopRule = nameToTopRule;
	        this.errors = [];
	    }
	    GastRefResolverVisitor.prototype.resolveRefs = function () {
	        var _this = this;
	        utils_1.forEach(this.nameToTopRule.values(), function (prod) {
	            _this.currTopLevel = prod;
	            prod.accept(_this);
	        });
	    };
	    GastRefResolverVisitor.prototype.visitNonTerminal = function (node) {
	        var ref = this.nameToTopRule.get(node.nonTerminalName);
	        if (!ref) {
	            var msg = "Invalid grammar, reference to rule which is not defined --> " + node.nonTerminalName;
	            this.errors.push({
	                message: msg,
	                type: parser_public_1.ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF,
	                ruleName: this.currTopLevel.name,
	                unresolvedRefName: node.nonTerminalName
	            });
	        }
	        else {
	            node.referencedRule = ref;
	        }
	    };
	    return GastRefResolverVisitor;
	}(gast_public_1.gast.GAstVisitor));
	exports.GastRefResolverVisitor = GastRefResolverVisitor;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var utils_1 = __webpack_require__(4);
	var gast;
	(function (gast) {
	    var AbstractProduction = (function () {
	        function AbstractProduction(definition) {
	            this.definition = definition;
	            this.implicitOccurrenceIndex = false;
	        }
	        AbstractProduction.prototype.accept = function (visitor) {
	            visitor.visit(this);
	            utils_1.forEach(this.definition, function (prod) {
	                prod.accept(visitor);
	            });
	        };
	        return AbstractProduction;
	    }());
	    gast.AbstractProduction = AbstractProduction;
	    var NonTerminal = (function (_super) {
	        __extends(NonTerminal, _super);
	        function NonTerminal(nonTerminalName, referencedRule, occurrenceInParent) {
	            if (referencedRule === void 0) { referencedRule = undefined; }
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, []);
	            this.nonTerminalName = nonTerminalName;
	            this.referencedRule = referencedRule;
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        Object.defineProperty(NonTerminal.prototype, "definition", {
	            get: function () {
	                if (this.referencedRule !== undefined) {
	                    return this.referencedRule.definition;
	                }
	                return [];
	            },
	            set: function (definition) {
	                // immutable
	            },
	            enumerable: true,
	            configurable: true
	        });
	        NonTerminal.prototype.accept = function (visitor) {
	            visitor.visit(this);
	            // don't visit children of a reference, we will get cyclic infinite loops if we do so
	        };
	        return NonTerminal;
	    }(AbstractProduction));
	    gast.NonTerminal = NonTerminal;
	    var Rule = (function (_super) {
	        __extends(Rule, _super);
	        function Rule(name, definition, orgText) {
	            if (orgText === void 0) { orgText = ""; }
	            _super.call(this, definition);
	            this.name = name;
	            this.orgText = orgText;
	        }
	        return Rule;
	    }(AbstractProduction));
	    gast.Rule = Rule;
	    var Flat = (function (_super) {
	        __extends(Flat, _super);
	        function Flat(definition) {
	            _super.call(this, definition);
	        }
	        return Flat;
	    }(AbstractProduction));
	    gast.Flat = Flat;
	    var Option = (function (_super) {
	        __extends(Option, _super);
	        function Option(definition, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return Option;
	    }(AbstractProduction));
	    gast.Option = Option;
	    var RepetitionMandatory = (function (_super) {
	        __extends(RepetitionMandatory, _super);
	        function RepetitionMandatory(definition, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return RepetitionMandatory;
	    }(AbstractProduction));
	    gast.RepetitionMandatory = RepetitionMandatory;
	    var RepetitionMandatoryWithSeparator = (function (_super) {
	        __extends(RepetitionMandatoryWithSeparator, _super);
	        function RepetitionMandatoryWithSeparator(definition, separator, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.separator = separator;
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return RepetitionMandatoryWithSeparator;
	    }(AbstractProduction));
	    gast.RepetitionMandatoryWithSeparator = RepetitionMandatoryWithSeparator;
	    var Repetition = (function (_super) {
	        __extends(Repetition, _super);
	        function Repetition(definition, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return Repetition;
	    }(AbstractProduction));
	    gast.Repetition = Repetition;
	    var RepetitionWithSeparator = (function (_super) {
	        __extends(RepetitionWithSeparator, _super);
	        function RepetitionWithSeparator(definition, separator, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.separator = separator;
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return RepetitionWithSeparator;
	    }(AbstractProduction));
	    gast.RepetitionWithSeparator = RepetitionWithSeparator;
	    var Alternation = (function (_super) {
	        __extends(Alternation, _super);
	        function Alternation(definition, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            _super.call(this, definition);
	            this.occurrenceInParent = occurrenceInParent;
	        }
	        return Alternation;
	    }(AbstractProduction));
	    gast.Alternation = Alternation;
	    var Terminal = (function () {
	        function Terminal(terminalType, occurrenceInParent) {
	            if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
	            this.terminalType = terminalType;
	            this.occurrenceInParent = occurrenceInParent;
	            this.implicitOccurrenceIndex = false;
	        }
	        Terminal.prototype.accept = function (visitor) {
	            visitor.visit(this);
	        };
	        return Terminal;
	    }());
	    gast.Terminal = Terminal;
	    var GAstVisitor = (function () {
	        function GAstVisitor() {
	        }
	        GAstVisitor.prototype.visit = function (node) {
	            if (node instanceof NonTerminal) {
	                this.visitNonTerminal(node);
	            }
	            else if (node instanceof Flat) {
	                this.visitFlat(node);
	            }
	            else if (node instanceof Option) {
	                this.visitOption(node);
	            }
	            else if (node instanceof RepetitionMandatory) {
	                this.visitRepetitionMandatory(node);
	            }
	            else if (node instanceof RepetitionMandatoryWithSeparator) {
	                this.visitRepetitionMandatoryWithSeparator(node);
	            }
	            else if (node instanceof RepetitionWithSeparator) {
	                this.visitRepetitionWithSeparator(node);
	            }
	            else if (node instanceof Repetition) {
	                this.visitRepetition(node);
	            }
	            else if (node instanceof Alternation) {
	                this.visitAlternation(node);
	            }
	            else if (node instanceof Terminal) {
	                this.visitTerminal(node);
	            }/* istanbul ignore else */ 
	            else if (node instanceof Rule) {
	                this.visitRule(node);
	            }
	            else {
	                /* istanbul ignore next */ throw Error("non exhaustive match");
	            }
	        };
	        GAstVisitor.prototype.visitNonTerminal = function (node) { };
	        GAstVisitor.prototype.visitFlat = function (node) { };
	        GAstVisitor.prototype.visitOption = function (node) { };
	        GAstVisitor.prototype.visitRepetition = function (node) { };
	        GAstVisitor.prototype.visitRepetitionMandatory = function (node) { };
	        GAstVisitor.prototype.visitRepetitionMandatoryWithSeparator = function (node) { };
	        GAstVisitor.prototype.visitRepetitionWithSeparator = function (node) { };
	        GAstVisitor.prototype.visitAlternation = function (node) { };
	        GAstVisitor.prototype.visitTerminal = function (node) { };
	        GAstVisitor.prototype.visitRule = function (node) { };
	        return GAstVisitor;
	    }());
	    gast.GAstVisitor = GAstVisitor;
	})(gast = exports.gast || (exports.gast = {}));


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var utils = __webpack_require__(4);
	var parser_public_1 = __webpack_require__(1);
	var gast_public_1 = __webpack_require__(7);
	var gast_1 = __webpack_require__(9);
	var tokens_public_1 = __webpack_require__(10);
	var first_1 = __webpack_require__(13);
	function validateGrammar(topLevels) {
	    var duplicateErrors = utils.map(topLevels, validateDuplicateProductions);
	    var leftRecursionErrors = utils.map(topLevels, function (currTopRule) { return validateNoLeftRecursion(currTopRule, currTopRule); });
	    var emptyAltErrors = utils.map(topLevels, validateEmptyOrAlternative);
	    return utils.flatten(duplicateErrors.concat(leftRecursionErrors, emptyAltErrors));
	}
	exports.validateGrammar = validateGrammar;
	function validateDuplicateProductions(topLevelRule) {
	    var collectorVisitor = new OccurrenceValidationCollector();
	    topLevelRule.accept(collectorVisitor);
	    var allRuleProductions = collectorVisitor.allProductions;
	    var productionGroups = utils.groupBy(allRuleProductions, identifyProductionForDuplicates);
	    var duplicates = utils.pick(productionGroups, function (currGroup) {
	        return currGroup.length > 1;
	    });
	    var errors = utils.map(utils.values(duplicates), function (currDuplicates) {
	        var firstProd = utils.first(currDuplicates);
	        var msg = createDuplicatesErrorMessage(currDuplicates, topLevelRule.name);
	        var dslName = gast_1.getProductionDslName(firstProd);
	        var defError = {
	            message: msg,
	            type: parser_public_1.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
	            ruleName: topLevelRule.name,
	            dslName: dslName,
	            occurrence: firstProd.occurrenceInParent
	        };
	        var param = getExtraProductionArgument(firstProd);
	        if (param) {
	            defError.parameter = param;
	        }
	        return defError;
	    });
	    return errors;
	}
	function createDuplicatesErrorMessage(duplicateProds, topLevelName) {
	    var firstProd = utils.first(duplicateProds);
	    var index = firstProd.occurrenceInParent;
	    var dslName = gast_1.getProductionDslName(firstProd);
	    var extraArgument = getExtraProductionArgument(firstProd);
	    var msg = "->" + dslName + "<- with occurrence index: ->" + index + "<-\n                  " + (extraArgument ? "and argument: " + extraArgument : "") + "\n                  appears more than once (" + duplicateProds.length + " times) in the top level rule: " + topLevelName + ".\n                  " + (index === 1 ? "note that " + dslName + " and " + dslName + "1 both have the same occurrence index 1}" : "") + "}\n                  to fix this make sure each usage of " + dslName + " " + (extraArgument ? "with the argument: " + extraArgument : "") + "\n                  in the rule " + topLevelName + " has a different occurrence index (1-5), as that combination acts as a unique\n                  position key in the grammar, which is needed by the parsing engine.";
	    // white space trimming time! better to trim afterwards as it allows to use WELL formatted multi line template strings...
	    msg = msg.replace(/[ \t]+/g, " ");
	    msg = msg.replace(/\s\s+/g, "\n");
	    return msg;
	}
	function identifyProductionForDuplicates(prod) {
	    return gast_1.getProductionDslName(prod) + "_#_" + prod.occurrenceInParent + "_#_" + getExtraProductionArgument(prod);
	}
	exports.identifyProductionForDuplicates = identifyProductionForDuplicates;
	function getExtraProductionArgument(prod) {
	    if (prod instanceof gast_public_1.gast.Terminal) {
	        return tokens_public_1.tokenName(prod.terminalType);
	    }
	    else if (prod instanceof gast_public_1.gast.NonTerminal) {
	        return prod.nonTerminalName;
	    }
	    else {
	        return "";
	    }
	}
	var OccurrenceValidationCollector = (function (_super) {
	    __extends(OccurrenceValidationCollector, _super);
	    function OccurrenceValidationCollector() {
	        _super.apply(this, arguments);
	        this.allProductions = [];
	    }
	    OccurrenceValidationCollector.prototype.visitNonTerminal = function (subrule) {
	        this.allProductions.push(subrule);
	    };
	    OccurrenceValidationCollector.prototype.visitOption = function (option) {
	        this.allProductions.push(option);
	    };
	    OccurrenceValidationCollector.prototype.visitRepetitionWithSeparator = function (manySep) {
	        this.allProductions.push(manySep);
	    };
	    OccurrenceValidationCollector.prototype.visitRepetitionMandatory = function (atLeastOne) {
	        this.allProductions.push(atLeastOne);
	    };
	    OccurrenceValidationCollector.prototype.visitRepetitionMandatoryWithSeparator = function (atLeastOneSep) {
	        this.allProductions.push(atLeastOneSep);
	    };
	    OccurrenceValidationCollector.prototype.visitRepetition = function (many) {
	        this.allProductions.push(many);
	    };
	    OccurrenceValidationCollector.prototype.visitAlternation = function (or) {
	        this.allProductions.push(or);
	    };
	    OccurrenceValidationCollector.prototype.visitTerminal = function (terminal) {
	        this.allProductions.push(terminal);
	    };
	    return OccurrenceValidationCollector;
	}(gast_public_1.gast.GAstVisitor));
	exports.OccurrenceValidationCollector = OccurrenceValidationCollector;
	var ruleNamePattern = /^[a-zA-Z_]\w*$/;
	function validateRuleName(ruleName, definedRulesNames, className) {
	    var errors = [];
	    var errMsg;
	    if (!ruleName.match(ruleNamePattern)) {
	        errMsg = "Invalid Grammar rule name --> " + ruleName + " it must match the pattern: " + ruleNamePattern.toString();
	        errors.push({
	            message: errMsg,
	            type: parser_public_1.ParserDefinitionErrorType.INVALID_RULE_NAME,
	            ruleName: ruleName
	        });
	    }
	    if ((utils.contains(definedRulesNames, ruleName))) {
	        errMsg = "Duplicate definition, rule: " + ruleName + " is already defined in the grammar: " + className;
	        errors.push({
	            message: errMsg,
	            type: parser_public_1.ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
	            ruleName: ruleName
	        });
	    }
	    return errors;
	}
	exports.validateRuleName = validateRuleName;
	function validateNoLeftRecursion(topRule, currRule, path) {
	    if (path === void 0) { path = []; }
	    var errors = [];
	    var nextNonTerminals = getFirstNoneTerminal(currRule.definition);
	    if (utils.isEmpty(nextNonTerminals)) {
	        return [];
	    }
	    else {
	        var ruleName = topRule.name;
	        var foundLeftRecursion = utils.contains(nextNonTerminals, topRule);
	        var pathNames = utils.map(path, function (currRule) { return currRule.name; });
	        var leftRecursivePath = ruleName + " --> " + pathNames.concat([ruleName]).join(" --> ");
	        if (foundLeftRecursion) {
	            var errMsg = "Left Recursion found in grammar.\n" +
	                ("rule: <" + ruleName + "> can be invoked from itself (directly or indirectly)\n") +
	                ("without consuming any Tokens. The grammar path that causes this is: \n " + leftRecursivePath + "\n") +
	                " To fix this refactor your grammar to remove the left recursion.\n" +
	                "see: https://en.wikipedia.org/wiki/LL_parser#Left_Factoring.";
	            errors.push({
	                message: errMsg,
	                type: parser_public_1.ParserDefinitionErrorType.LEFT_RECURSION,
	                ruleName: ruleName
	            });
	        }
	        // we are only looking for cyclic paths leading back to the specific topRule
	        // other cyclic paths are ignored, we still need this difference to avoid infinite loops...
	        var validNextSteps = utils.difference(nextNonTerminals, path.concat([topRule]));
	        var errorsFromNextSteps = utils.map(validNextSteps, function (currRefRule) {
	            var newPath = utils.cloneArr(path);
	            newPath.push(currRefRule);
	            return validateNoLeftRecursion(topRule, currRefRule, newPath);
	        });
	        return errors.concat(utils.flatten(errorsFromNextSteps));
	    }
	}
	exports.validateNoLeftRecursion = validateNoLeftRecursion;
	function getFirstNoneTerminal(definition) {
	    var result = [];
	    if (utils.isEmpty(definition)) {
	        return result;
	    }
	    var firstProd = utils.first(definition);
	    if (firstProd instanceof gast_public_1.gast.NonTerminal) {
	        // this allows the check to be performed on partially valid grammars that have not been completly resolved.
	        if (firstProd.referencedRule === undefined) {
	            return result;
	        }
	        result.push(firstProd.referencedRule);
	    }
	    else if (firstProd instanceof gast_public_1.gast.Flat ||
	        firstProd instanceof gast_public_1.gast.Option ||
	        firstProd instanceof gast_public_1.gast.RepetitionMandatory ||
	        firstProd instanceof gast_public_1.gast.RepetitionMandatoryWithSeparator ||
	        firstProd instanceof gast_public_1.gast.RepetitionWithSeparator ||
	        firstProd instanceof gast_public_1.gast.Repetition) {
	        result = result.concat(getFirstNoneTerminal(firstProd.definition));
	    }
	    else if (firstProd instanceof gast_public_1.gast.Alternation) {
	        // each sub definition in alternation is a FLAT
	        result = utils.flatten(utils.map(firstProd.definition, function (currSubDef) { return getFirstNoneTerminal(currSubDef.definition); }));
	    }/* istanbul ignore else */ 
	    else if (firstProd instanceof gast_public_1.gast.Terminal) {
	    }
	    else {
	        /* istanbul ignore next */ throw Error("non exhaustive match");
	    }
	    var isFirstOptional = gast_1.isOptionalProd(firstProd);
	    var hasMore = definition.length > 1;
	    if (isFirstOptional && hasMore) {
	        var rest = utils.drop(definition);
	        return result.concat(getFirstNoneTerminal(rest));
	    }
	    else {
	        return result;
	    }
	}
	exports.getFirstNoneTerminal = getFirstNoneTerminal;
	var OrCollector = (function (_super) {
	    __extends(OrCollector, _super);
	    function OrCollector() {
	        _super.apply(this, arguments);
	        this.alternations = [];
	    }
	    OrCollector.prototype.visitAlternation = function (node) {
	        this.alternations.push(node);
	    };
	    return OrCollector;
	}(gast_public_1.gast.GAstVisitor));
	function validateEmptyOrAlternative(topLevelRule) {
	    var orCollector = new OrCollector();
	    topLevelRule.accept(orCollector);
	    var ors = orCollector.alternations;
	    var errors = utils.reduce(ors, function (errors, currOr) {
	        var exceptLast = utils.dropRight(currOr.definition);
	        var currErrors = utils.map(exceptLast, function (currAlternative, currAltIdx) {
	            if (utils.isEmpty(first_1.first(currAlternative))) {
	                return {
	                    message: ("Ambiguous empty alternative: <" + (currAltIdx + 1) + ">") +
	                        (" in <OR" + currOr.occurrenceInParent + "> inside <" + topLevelRule.name + "> Rule.\n") +
	                        "Only the last alternative may be an empty alternative.",
	                    type: parser_public_1.ParserDefinitionErrorType.NONE_LAST_EMPTY_ALT,
	                    ruleName: topLevelRule.name,
	                    occurrence: currOr.occurrenceInParent,
	                    alternative: currAltIdx + 1
	                };
	            }
	            else {
	                return null;
	            }
	        });
	        return errors.concat(utils.compact(currErrors));
	    }, []);
	    return errors;
	}
	exports.validateEmptyOrAlternative = validateEmptyOrAlternative;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var gast_public_1 = __webpack_require__(7);
	var utils_1 = __webpack_require__(4);
	var lang_extensions_1 = __webpack_require__(3);
	function isSequenceProd(prod) {
	    return prod instanceof gast_public_1.gast.Flat ||
	        prod instanceof gast_public_1.gast.Option ||
	        prod instanceof gast_public_1.gast.Repetition ||
	        prod instanceof gast_public_1.gast.RepetitionMandatory ||
	        prod instanceof gast_public_1.gast.RepetitionMandatoryWithSeparator ||
	        prod instanceof gast_public_1.gast.RepetitionWithSeparator ||
	        prod instanceof gast_public_1.gast.Terminal ||
	        prod instanceof gast_public_1.gast.Rule;
	}
	exports.isSequenceProd = isSequenceProd;
	function isOptionalProd(prod, alreadyVisited) {
	    if (alreadyVisited === void 0) { alreadyVisited = []; }
	    var isDirectlyOptional = prod instanceof gast_public_1.gast.Option ||
	        prod instanceof gast_public_1.gast.Repetition ||
	        prod instanceof gast_public_1.gast.RepetitionWithSeparator;
	    if (isDirectlyOptional) {
	        return true;
	    }
	    // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
	    // empty optional top rule
	    // may be indirectly optional ((A?B?C?) | (D?E?F?))
	    if (prod instanceof gast_public_1.gast.Alternation) {
	        // for OR its enough for just one of the alternatives to be optional
	        return utils_1.some(prod.definition, function (subProd) {
	            return isOptionalProd(subProd, alreadyVisited);
	        });
	    }
	    else if (prod instanceof gast_public_1.gast.NonTerminal && utils_1.contains(alreadyVisited, prod)) {
	        // avoiding stack overflow due to infinite recursion
	        return false;
	    }
	    else if (prod instanceof gast_public_1.gast.AbstractProduction) {
	        if (prod instanceof gast_public_1.gast.NonTerminal) {
	            alreadyVisited.push(prod);
	        }
	        return utils_1.every(prod.definition, function (subProd) {
	            return isOptionalProd(subProd, alreadyVisited);
	        });
	    }
	    else {
	        return false;
	    }
	}
	exports.isOptionalProd = isOptionalProd;
	function isBranchingProd(prod) {
	    return prod instanceof gast_public_1.gast.Alternation;
	}
	exports.isBranchingProd = isBranchingProd;
	var productionToDslName = {};
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.NonTerminal)] = "SUBRULE";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.Option)] = "OPTION";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.RepetitionMandatory)] = "AT_LEAST_ONE";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.RepetitionMandatoryWithSeparator)] = "AT_LEAST_ONE_SEP";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.RepetitionWithSeparator)] = "MANY_SEP";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.Repetition)] = "MANY";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.Alternation)] = "OR";
	productionToDslName[lang_extensions_1.functionName(gast_public_1.gast.Terminal)] = "CONSUME";
	function getProductionDslName(prod) {
	    var clazz = prod.constructor;
	    var prodName = lang_extensions_1.functionName(clazz);
	    return productionToDslName[prodName];
	}
	exports.getProductionDslName = getProductionDslName;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var utils_1 = __webpack_require__(4);
	var lang_extensions_1 = __webpack_require__(3);
	var lexer_public_1 = __webpack_require__(11);
	function tokenName(clazz) {
	    // used to support js inheritance patterns that do not use named functions
	    // in that situation setting a property tokenName on a token constructor will
	    // enable producing readable error messages.
	    if (utils_1.isString(clazz.tokenName)) {
	        return clazz.tokenName;
	    }
	    else {
	        return lang_extensions_1.functionName(clazz);
	    }
	}
	exports.tokenName = tokenName;
	/**
	 * utility to help the poor souls who are still stuck writing pure javascript 5.1
	 * extend and create Token subclasses in a less verbose manner
	 *
	 * @param {string} tokenName - the name of the new TokenClass
	 * @param {RegExp|Function} patternOrParent - RegExp Pattern or Parent Token Constructor
	 * @param {Function} parentConstructor - the Token class to be extended
	 * @returns {Function} - a constructor for the new extended Token subclass
	 */
	function extendToken(tokenName, patternOrParent, parentConstructor) {
	    if (patternOrParent === void 0) { patternOrParent = undefined; }
	    if (parentConstructor === void 0) { parentConstructor = Token; }
	    var pattern;
	    if (utils_1.isRegExp(patternOrParent) ||
	        patternOrParent === lexer_public_1.Lexer.SKIPPED ||
	        patternOrParent === lexer_public_1.Lexer.NA) {
	        pattern = patternOrParent;
	    }
	    else if (utils_1.isFunction(patternOrParent)) {
	        parentConstructor = patternOrParent;
	        pattern = undefined;
	    }
	    var derivedCostructor = function () {
	        parentConstructor.apply(this, arguments);
	    };
	    // static properties mixing
	    derivedCostructor = utils_1.assign(derivedCostructor, parentConstructor);
	    // the tokenName property will be used by the Parser for Error Messages if the Token's constructor is anonymous
	    derivedCostructor.tokenName = tokenName;
	    derivedCostructor.prototype = Object.create(parentConstructor.prototype);
	    derivedCostructor.prototype.constructor = derivedCostructor;
	    if (!utils_1.isUndefined(pattern)) {
	        derivedCostructor.PATTERN = pattern;
	    }
	    return derivedCostructor;
	}
	exports.extendToken = extendToken;
	var Token = (function () {
	    /**
	     * @param {string} image the textual representation of the Token as it appeared in the text
	     * @param {number} offset offset of the first character of the Token
	     * @param {number} startLine line of the first character of the Token
	     * @param {number} startColumn column of the first character of the Token
	     * @param {number} endLine line of the last character of the Token
	     * @param {number} endColumn column of the last character of the Token
	     *
	     * Things to note:
	     * * "do"  {startColumn : 1, endColumn: 2} --> the range is inclusive to exclusive 1...2 (2 chars long).
	     * * "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
	     * * "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
	     *                                                              (unicode escaping is untouched).
	     */
	    function Token(image, offset, startLine, startColumn, endLine, endColumn) {
	        if (endLine === void 0) { endLine = startLine; }
	        if (endColumn === void 0) { endColumn = startColumn + image.length - 1; }
	        this.image = image;
	        this.offset = offset;
	        this.startLine = startLine;
	        this.startColumn = startColumn;
	        this.endLine = endLine;
	        this.endColumn = endColumn;
	        // this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery
	        this.isInsertedInRecovery = false;
	    }
	    return Token;
	}());
	exports.Token = Token;
	/**
	 * a special kind of Token which does not really exist in the input
	 * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
	 * for example, EOF (end-of-file).
	 */
	var VirtualToken = (function (_super) {
	    __extends(VirtualToken, _super);
	    function VirtualToken() {
	        _super.call(this, "", -1, -1, -1, -1, -1);
	    }
	    return VirtualToken;
	}(Token));
	exports.VirtualToken = VirtualToken;
	var EOF = (function (_super) {
	    __extends(EOF, _super);
	    function EOF() {
	        _super.apply(this, arguments);
	    }
	    return EOF;
	}(VirtualToken));
	exports.EOF = EOF;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var lexer_1 = __webpack_require__(12);
	var utils_1 = __webpack_require__(4);
	(function (LexerDefinitionErrorType) {
	    LexerDefinitionErrorType[LexerDefinitionErrorType["MISSING_PATTERN"] = 0] = "MISSING_PATTERN";
	    LexerDefinitionErrorType[LexerDefinitionErrorType["INVALID_PATTERN"] = 1] = "INVALID_PATTERN";
	    LexerDefinitionErrorType[LexerDefinitionErrorType["EOI_ANCHOR_FOUND"] = 2] = "EOI_ANCHOR_FOUND";
	    LexerDefinitionErrorType[LexerDefinitionErrorType["UNSUPPORTED_FLAGS_FOUND"] = 3] = "UNSUPPORTED_FLAGS_FOUND";
	    LexerDefinitionErrorType[LexerDefinitionErrorType["DUPLICATE_PATTERNS_FOUND"] = 4] = "DUPLICATE_PATTERNS_FOUND";
	    LexerDefinitionErrorType[LexerDefinitionErrorType["INVALID_GROUP_TYPE_FOUND"] = 5] = "INVALID_GROUP_TYPE_FOUND";
	})(exports.LexerDefinitionErrorType || (exports.LexerDefinitionErrorType = {}));
	var LexerDefinitionErrorType = exports.LexerDefinitionErrorType;
	var Lexer = (function () {
	    /**
	     * @param {Function[]} tokenClasses constructor functions for the Tokens types this scanner will support
	     *                     These constructors must be in one of THESE forms:
	     *
	     *  1. With a PATTERN property that has a RegExp value for tokens to match:
	     *     example: -->class Integer extends Token { static PATTERN = /[1-9]\d }<--
	     *
	     *  2. With a PATTERN property that has the value of the var Lexer.NA defined above.
	     *     This is a convenience form used to avoid matching Token classes that only act as categories.
	     *     example: -->class Keyword extends Token { static PATTERN = NA }<--
	     *
	     *
	     *   The following RegExp patterns are not supported:
	     *   a. '$' for match at end of input
	     *   b. /b global flag
	     *   c. /m multi-line flag
	     *
	     *   The Lexer will identify the first pattern the matches, Therefor the order of Token Constructors passed
	     *   To the SimpleLexer's constructor is meaningful. If two patterns may match the same string, the longer one
	     *   should be before the shorter one.
	     *
	     *   Note that there are situations in which we may wish to place the longer pattern after the shorter one.
	     *   For example: keywords vs Identifiers.
	     *   'do'(/do/) and 'done'(/w+)
	     *
	     *   * If the Identifier pattern appears before the 'do' pattern both 'do' and 'done'
	     *     will be lexed as an Identifier.
	     *
	     *   * If the 'do' pattern appears before the Identifier pattern 'do' will be lexed correctly as a keyword.
	     *     however 'done' will be lexed as TWO tokens keyword 'do' and identifier 'ne'.
	     *
	     *   To resolve this problem, add a static property on the keyword's Tokens constructor named: LONGER_ALT
	     *   example:
	     *
	     *       export class Identifier extends Keyword { static PATTERN = /[_a-zA-Z][_a-zA-Z0-9]/ }
	     *       export class Keyword extends Token {
	     *          static PATTERN = lex.NA
	     *          static LONGER_ALT = Identifier
	     *       }
	     *       export class Do extends Keyword { static PATTERN = /do/ }
	     *       export class While extends Keyword { static PATTERN = /while/ }
	     *       export class Return extends Keyword { static PATTERN = /return/ }
	     *
	     *   The lexer will then also attempt to match a (longer) Identifier each time a keyword is matched
	     *
	     *
	     * @param {boolean} [deferDefinitionErrorsHandling=false]
	     *                  an optional flag indicating that lexer definition errors
	     *                  should not automatically cause an error to be raised.
	     *                  This can be useful when wishing to indicate lexer errors in another manner
	     *                  than simply throwing an error (for example in an online playground).
	     */
	    function Lexer(tokenClasses, deferDefinitionErrorsHandling) {
	        if (deferDefinitionErrorsHandling === void 0) { deferDefinitionErrorsHandling = false; }
	        this.tokenClasses = tokenClasses;
	        this.lexerDefinitionErrors = [];
	        this.lexerDefinitionErrors = lexer_1.validatePatterns(tokenClasses);
	        if (!utils_1.isEmpty(this.lexerDefinitionErrors) && !deferDefinitionErrorsHandling) {
	            var allErrMessages = utils_1.map(this.lexerDefinitionErrors, function (error) {
	                return error.message;
	            });
	            var allErrMessagesString = allErrMessages.join("-----------------------\n");
	            throw new Error("Errors detected in definition of Lexer:\n" + allErrMessagesString);
	        }
	        // If definition errors were encountered, the analysis phase may fail unexpectedly/
	        // Considering a lexer with definition errors may never be used, there is no point
	        // to performing the analysis anyhow...
	        if (utils_1.isEmpty(this.lexerDefinitionErrors)) {
	            var analyzeResult = lexer_1.analyzeTokenClasses(tokenClasses);
	            this.allPatterns = analyzeResult.allPatterns;
	            this.patternIdxToClass = analyzeResult.patternIdxToClass;
	            this.patternIdxToGroup = analyzeResult.patternIdxToGroup;
	            this.patternIdxToLongerAltIdx = analyzeResult.patternIdxToLongerAltIdx;
	            this.patternIdxToCanLineTerminator = analyzeResult.patternIdxToCanLineTerminator;
	            this.emptyGroups = analyzeResult.emptyGroups;
	        }
	    }
	    /**
	     * Will lex(Tokenize) a string.
	     * Note that this can be called repeatedly on different strings as this method
	     * does not modify the state of the Lexer.
	     *
	     * @param {string} text the string to lex
	     * @returns {{tokens: {Token}[], errors: string[]}}
	     */
	    Lexer.prototype.tokenize = function (text) {
	        var match, i, j, matchAlt, longerAltIdx, matchedImage, imageLength, group, tokClass, newToken, errLength, canMatchedContainLineTerminator, fixForEndingInLT, c, droppedChar, lastLTIdx, errorMessage, lastCharIsLT;
	        var orgInput = text;
	        var offset = 0;
	        var matchedTokens = [];
	        var errors = [];
	        var line = 1;
	        var column = 1;
	        var groups = utils_1.cloneObj(this.emptyGroups);
	        if (!utils_1.isEmpty(this.lexerDefinitionErrors)) {
	            var allErrMessages = utils_1.map(this.lexerDefinitionErrors, function (error) {
	                return error.message;
	            });
	            var allErrMessagesString = allErrMessages.join("-----------------------\n");
	            throw new Error("Unable to Tokenize because Errors detected in definition of Lexer:\n" + allErrMessagesString);
	        }
	        while (text.length > 0) {
	            match = null;
	            for (i = 0; i < this.allPatterns.length; i++) {
	                match = this.allPatterns[i].exec(text);
	                if (match !== null) {
	                    // even though this pattern matched we must try a another longer alternative.
	                    // this can be used to prioritize keywords over identifers
	                    longerAltIdx = this.patternIdxToLongerAltIdx[i];
	                    if (longerAltIdx) {
	                        matchAlt = this.allPatterns[longerAltIdx].exec(text);
	                        if (matchAlt && matchAlt[0].length > match[0].length) {
	                            match = matchAlt;
	                            i = longerAltIdx;
	                        }
	                    }
	                    break;
	                }
	            }
	            if (match !== null) {
	                matchedImage = match[0];
	                imageLength = matchedImage.length;
	                group = this.patternIdxToGroup[i];
	                if (group !== undefined) {
	                    tokClass = this.patternIdxToClass[i];
	                    newToken = new tokClass(matchedImage, offset, line, column);
	                    if (group === "default") {
	                        matchedTokens.push(newToken);
	                    }
	                    else {
	                        groups[group].push(newToken);
	                    }
	                }
	                text = text.slice(imageLength);
	                offset = offset + imageLength;
	                column = column + imageLength; // TODO: with newlines the column may be assigned twice
	                canMatchedContainLineTerminator = this.patternIdxToCanLineTerminator[i];
	                if (canMatchedContainLineTerminator) {
	                    var lineTerminatorsInMatch = lexer_1.countLineTerminators(matchedImage);
	                    // TODO: identify edge case of one token ending in '\r' and another one starting with '\n'
	                    if (lineTerminatorsInMatch !== 0) {
	                        line = line + lineTerminatorsInMatch;
	                        lastLTIdx = imageLength - 1;
	                        while (lastLTIdx >= 0) {
	                            c = matchedImage.charCodeAt(lastLTIdx);
	                            // scan in reverse to find last lineTerminator in image
	                            if (c === 13 || c === 10) {
	                                break;
	                            }
	                            lastLTIdx--;
	                        }
	                        column = imageLength - lastLTIdx;
	                        if (group !== undefined) {
	                            lastCharIsLT = lastLTIdx === imageLength - 1;
	                            fixForEndingInLT = lastCharIsLT ? -1 : 0;
	                            if (!(lineTerminatorsInMatch === 1 && lastCharIsLT)) {
	                                // if a token ends in a LT that last LT only affects the line numbering of following Tokens
	                                newToken.endLine = line + fixForEndingInLT;
	                                // the last LT in a token does not affect the endColumn either as the [columnStart ... columnEnd)
	                                // inclusive to exclusive range.
	                                newToken.endColumn = column - 1 + -fixForEndingInLT;
	                            }
	                        }
	                    }
	                }
	            }
	            else {
	                var errorStartOffset = offset;
	                var errorLine = line;
	                var errorColumn = column;
	                var foundResyncPoint = false;
	                while (!foundResyncPoint && text.length > 0) {
	                    // drop chars until we succeed in matching something
	                    droppedChar = text.charCodeAt(0);
	                    if (droppedChar === 10 ||
	                        (droppedChar === 13 &&
	                            (text.length === 1 || (text.length > 1 && text.charCodeAt(1) !== 10)))) {
	                        line++;
	                        column = 1;
	                    }
	                    else {
	                        // either when skipping the next char, or when consuming the following pattern
	                        // (which will have to start in a '\n' if we manage to consume it)
	                        column++;
	                    }
	                    text = text.substr(1);
	                    offset++;
	                    for (j = 0; j < this.allPatterns.length; j++) {
	                        foundResyncPoint = this.allPatterns[j].test(text);
	                        if (foundResyncPoint) {
	                            break;
	                        }
	                    }
	                }
	                errLength = offset - errorStartOffset;
	                // at this point we either re-synced or reached the end of the input text
	                errorMessage = ("unexpected character: ->" + orgInput.charAt(errorStartOffset) + "<- at offset: " + errorStartOffset + ",") +
	                    (" skipped " + (offset - errorStartOffset) + " characters.");
	                errors.push({ line: errorLine, column: errorColumn, length: errLength, message: errorMessage });
	            }
	        }
	        return { tokens: matchedTokens, groups: groups, errors: errors };
	    };
	    Lexer.SKIPPED = {
	        description: "This marks a skipped Token pattern, this means each token identified by it will" +
	            "be consumed and then throw into oblivion, this can be used to for example: skip whitespace."
	    };
	    Lexer.NA = /NOT_APPLICABLE/;
	    return Lexer;
	}());
	exports.Lexer = Lexer;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var tokens_public_1 = __webpack_require__(10);
	var lexer_public_1 = __webpack_require__(11);
	var utils_1 = __webpack_require__(4);
	var PATTERN = "PATTERN";
	function analyzeTokenClasses(tokenClasses) {
	    var onlyRelevantClasses = utils_1.reject(tokenClasses, function (currClass) {
	        return currClass[PATTERN] === lexer_public_1.Lexer.NA;
	    });
	    var allTransformedPatterns = utils_1.map(onlyRelevantClasses, function (currClass) {
	        return addStartOfInput(currClass[PATTERN]);
	    });
	    var allPatternsToClass = utils_1.zipObject(allTransformedPatterns, onlyRelevantClasses);
	    var patternIdxToClass = utils_1.map(allTransformedPatterns, function (pattern) {
	        return allPatternsToClass[pattern.toString()];
	    });
	    var patternIdxToGroup = utils_1.map(onlyRelevantClasses, function (clazz) {
	        var groupName = clazz.GROUP;
	        if (groupName === lexer_public_1.Lexer.SKIPPED) {
	            return undefined;
	        }
	        else if (utils_1.isString(groupName)) {
	            return groupName;
	        }/* istanbul ignore else */ 
	        else if (utils_1.isUndefined(groupName)) {
	            return "default";
	        }
	        else {
	            /* istanbul ignore next */ throw Error("non exhaustive match");
	        }
	    });
	    var patternIdxToLongerAltIdx = utils_1.map(onlyRelevantClasses, function (clazz) {
	        var longerAltClass = clazz.LONGER_ALT;
	        if (longerAltClass) {
	            var longerAltIdx = utils_1.indexOf(onlyRelevantClasses, longerAltClass);
	            return longerAltIdx;
	        }
	    });
	    var patternIdxToCanLineTerminator = utils_1.map(allTransformedPatterns, function (pattern) {
	        // TODO: unicode escapes of line terminators too?
	        return /\\n|\\r|\\s/g.test(pattern.source);
	    });
	    var emptyGroups = utils_1.reduce(onlyRelevantClasses, function (acc, clazz) {
	        var groupName = clazz.GROUP;
	        if (utils_1.isString(groupName)) {
	            acc[groupName] = [];
	        }
	        return acc;
	    }, {});
	    return {
	        allPatterns: allTransformedPatterns,
	        patternIdxToClass: patternIdxToClass,
	        patternIdxToGroup: patternIdxToGroup,
	        patternIdxToLongerAltIdx: patternIdxToLongerAltIdx,
	        patternIdxToCanLineTerminator: patternIdxToCanLineTerminator,
	        emptyGroups: emptyGroups
	    };
	}
	exports.analyzeTokenClasses = analyzeTokenClasses;
	function validatePatterns(tokenClasses) {
	    var errors = [];
	    var missingResult = findMissingPatterns(tokenClasses);
	    var validTokenClasses = missingResult.validTokenClasses;
	    errors = errors.concat(missingResult.errors);
	    var invalidResult = findInvalidPatterns(validTokenClasses);
	    validTokenClasses = invalidResult.validTokenClasses;
	    errors = errors.concat(invalidResult.errors);
	    errors = errors.concat(findEndOfInputAnchor(validTokenClasses));
	    errors = errors.concat(findUnsupportedFlags(validTokenClasses));
	    errors = errors.concat(findDuplicatePatterns(validTokenClasses));
	    errors = errors.concat(findInvalidGroupType(validTokenClasses));
	    return errors;
	}
	exports.validatePatterns = validatePatterns;
	function findMissingPatterns(tokenClasses) {
	    var tokenClassesWithMissingPattern = utils_1.filter(tokenClasses, function (currClass) {
	        return !utils_1.has(currClass, PATTERN);
	    });
	    var errors = utils_1.map(tokenClassesWithMissingPattern, function (currClass) {
	        return {
	            message: "Token class: ->" + tokens_public_1.tokenName(currClass) + "<- missing static 'PATTERN' property",
	            type: lexer_public_1.LexerDefinitionErrorType.MISSING_PATTERN,
	            tokenClasses: [currClass]
	        };
	    });
	    var validTokenClasses = utils_1.difference(tokenClasses, tokenClassesWithMissingPattern);
	    return { errors: errors, validTokenClasses: validTokenClasses };
	}
	exports.findMissingPatterns = findMissingPatterns;
	function findInvalidPatterns(tokenClasses) {
	    var tokenClassesWithInvalidPattern = utils_1.filter(tokenClasses, function (currClass) {
	        var pattern = currClass[PATTERN];
	        return !utils_1.isRegExp(pattern);
	    });
	    var errors = utils_1.map(tokenClassesWithInvalidPattern, function (currClass) {
	        return {
	            message: "Token class: ->" + tokens_public_1.tokenName(currClass) + "<- static 'PATTERN' can only be a RegExp",
	            type: lexer_public_1.LexerDefinitionErrorType.INVALID_PATTERN,
	            tokenClasses: [currClass]
	        };
	    });
	    var validTokenClasses = utils_1.difference(tokenClasses, tokenClassesWithInvalidPattern);
	    return { errors: errors, validTokenClasses: validTokenClasses };
	}
	exports.findInvalidPatterns = findInvalidPatterns;
	var end_of_input = /[^\\][\$]/;
	function findEndOfInputAnchor(tokenClasses) {
	    var invalidRegex = utils_1.filter(tokenClasses, function (currClass) {
	        var pattern = currClass[PATTERN];
	        return end_of_input.test(pattern.source);
	    });
	    var errors = utils_1.map(invalidRegex, function (currClass) {
	        return {
	            message: "Token class: ->" + tokens_public_1.tokenName(currClass) + "<- static 'PATTERN' cannot contain end of input anchor '$'",
	            type: lexer_public_1.LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
	            tokenClasses: [currClass]
	        };
	    });
	    return errors;
	}
	exports.findEndOfInputAnchor = findEndOfInputAnchor;
	function findUnsupportedFlags(tokenClasses) {
	    var invalidFlags = utils_1.filter(tokenClasses, function (currClass) {
	        var pattern = currClass[PATTERN];
	        return pattern instanceof RegExp && (pattern.multiline || pattern.global);
	    });
	    var errors = utils_1.map(invalidFlags, function (currClass) {
	        return {
	            message: "Token class: ->" + tokens_public_1.tokenName(currClass) +
	                "<- static 'PATTERN' may NOT contain global('g') or multiline('m')",
	            type: lexer_public_1.LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND,
	            tokenClasses: [currClass]
	        };
	    });
	    return errors;
	}
	exports.findUnsupportedFlags = findUnsupportedFlags;
	// This can only test for identical duplicate RegExps, not semantically equivalent ones.
	function findDuplicatePatterns(tokenClasses) {
	    var found = [];
	    var identicalPatterns = utils_1.map(tokenClasses, function (outerClass) {
	        return utils_1.reduce(tokenClasses, function (result, innerClass) {
	            if ((outerClass.PATTERN.source === innerClass.PATTERN.source) && !utils_1.contains(found, innerClass) &&
	                innerClass.PATTERN !== lexer_public_1.Lexer.NA) {
	                // this avoids duplicates in the result, each class may only appear in one "set"
	                // in essence we are creating Equivalence classes on equality relation.
	                found.push(innerClass);
	                result.push(innerClass);
	                return result;
	            }
	            return result;
	        }, []);
	    });
	    identicalPatterns = utils_1.compact(identicalPatterns);
	    var duplicatePatterns = utils_1.filter(identicalPatterns, function (currIdenticalSet) {
	        return currIdenticalSet.length > 1;
	    });
	    var errors = utils_1.map(duplicatePatterns, function (setOfIdentical) {
	        var classNames = utils_1.map(setOfIdentical, function (currClass) {
	            return tokens_public_1.tokenName(currClass);
	        });
	        var dupPatternSrc = utils_1.first(setOfIdentical).PATTERN;
	        return {
	            message: ("The same RegExp pattern ->" + dupPatternSrc + "<-") +
	                ("has been used in all the following classes: " + classNames.join(", ") + " <-"),
	            type: lexer_public_1.LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND,
	            tokenClasses: setOfIdentical
	        };
	    });
	    return errors;
	}
	exports.findDuplicatePatterns = findDuplicatePatterns;
	function findInvalidGroupType(tokenClasses) {
	    var invalidTypes = utils_1.filter(tokenClasses, function (clazz) {
	        if (!utils_1.has(clazz, "GROUP")) {
	            return false;
	        }
	        var group = clazz.GROUP;
	        return group !== lexer_public_1.Lexer.SKIPPED &&
	            group !== lexer_public_1.Lexer.NA && !utils_1.isString(group);
	    });
	    var errors = utils_1.map(invalidTypes, function (currClass) {
	        return {
	            message: "Token class: ->" + tokens_public_1.tokenName(currClass) + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
	            type: lexer_public_1.LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
	            tokenClasses: [currClass]
	        };
	    });
	    return errors;
	}
	exports.findInvalidGroupType = findInvalidGroupType;
	function addStartOfInput(pattern) {
	    var flags = pattern.ignoreCase ? "i" : "";
	    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
	    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
	    return new RegExp("^(?:" + pattern.source + ")", flags);
	}
	exports.addStartOfInput = addStartOfInput;
	function countLineTerminators(text) {
	    var lineTerminators = 0;
	    var currOffset = 0;
	    while (currOffset < text.length) {
	        var c = text.charCodeAt(currOffset);
	        if (c === 10) {
	            lineTerminators++;
	        }
	        else if (c === 13) {
	            if (currOffset !== text.length - 1 &&
	                text.charCodeAt(currOffset + 1) === 10) {
	            }
	            else {
	                lineTerminators++;
	            }
	        }
	        currOffset++;
	    }
	    return lineTerminators;
	}
	exports.countLineTerminators = countLineTerminators;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var gast_public_1 = __webpack_require__(7);
	var gast_1 = __webpack_require__(9);
	var utils_1 = __webpack_require__(4);
	function first(prod) {
	    if (prod instanceof gast_public_1.gast.NonTerminal) {
	        // this could in theory cause infinite loops if
	        // (1) prod A refs prod B.
	        // (2) prod B refs prod A
	        // (3) AB can match the empty set
	        // in other words a cycle where everything is optional so the first will keep
	        // looking ahead for the next optional part and will never exit
	        // currently there is no safeguard for this unique edge case because
	        // (1) not sure a grammar in which this can happen is useful for anything (productive)
	        return first(prod.referencedRule);
	    }
	    else if (prod instanceof gast_public_1.gast.Terminal) {
	        return firstForTerminal(prod);
	    }
	    else if (gast_1.isSequenceProd(prod)) {
	        return firstForSequence(prod);
	    }/* istanbul ignore else */ 
	    else if (gast_1.isBranchingProd(prod)) {
	        return firstForBranching(prod);
	    }
	    else {
	        /* istanbul ignore next */ throw Error("non exhaustive match");
	    }
	}
	exports.first = first;
	function firstForSequence(prod) {
	    var firstSet = [];
	    var seq = prod.definition;
	    var nextSubProdIdx = 0;
	    var hasInnerProdsRemaining = seq.length > nextSubProdIdx;
	    var currSubProd;
	    // so we enter the loop at least once (if the definition is not empty
	    var isLastInnerProdOptional = true;
	    // scan a sequence until it's end or until we have found a NONE optional production in it
	    while (hasInnerProdsRemaining && isLastInnerProdOptional) {
	        currSubProd = seq[nextSubProdIdx];
	        isLastInnerProdOptional = gast_1.isOptionalProd(currSubProd);
	        firstSet = firstSet.concat(first(currSubProd));
	        nextSubProdIdx = nextSubProdIdx + 1;
	        hasInnerProdsRemaining = seq.length > nextSubProdIdx;
	    }
	    return utils_1.uniq(firstSet);
	}
	exports.firstForSequence = firstForSequence;
	function firstForBranching(prod) {
	    var allAlternativesFirsts = utils_1.map(prod.definition, function (innerProd) {
	        return first(innerProd);
	    });
	    return utils_1.uniq(utils_1.flatten(allAlternativesFirsts));
	}
	exports.firstForBranching = firstForBranching;
	function firstForTerminal(terminal) {
	    return [terminal.terminalType];
	}
	exports.firstForTerminal = firstForTerminal;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var rest_1 = __webpack_require__(15);
	var lang_extensions_1 = __webpack_require__(3);
	var gast_public_1 = __webpack_require__(7);
	var first_1 = __webpack_require__(13);
	var utils_1 = __webpack_require__(4);
	var constants_1 = __webpack_require__(16);
	var tokens_public_1 = __webpack_require__(10);
	// This ResyncFollowsWalker computes all of the follows required for RESYNC
	// (skipping reference production).
	var ResyncFollowsWalker = (function (_super) {
	    __extends(ResyncFollowsWalker, _super);
	    function ResyncFollowsWalker(topProd) {
	        _super.call(this);
	        this.topProd = topProd;
	        this.follows = new lang_extensions_1.HashTable();
	    }
	    ResyncFollowsWalker.prototype.startWalking = function () {
	        this.walk(this.topProd);
	        return this.follows;
	    };
	    ResyncFollowsWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) {
	        // do nothing! just like in the public sector after 13:00
	    };
	    ResyncFollowsWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) {
	        var followName = buildBetweenProdsFollowPrefix(refProd.referencedRule, refProd.occurrenceInParent) + this.topProd.name;
	        var fullRest = currRest.concat(prevRest);
	        var restProd = new gast_public_1.gast.Flat(fullRest);
	        var t_in_topProd_follows = first_1.first(restProd);
	        this.follows.put(followName, t_in_topProd_follows);
	    };
	    return ResyncFollowsWalker;
	}(rest_1.RestWalker));
	exports.ResyncFollowsWalker = ResyncFollowsWalker;
	function computeAllProdsFollows(topProductions) {
	    var reSyncFollows = new lang_extensions_1.HashTable();
	    utils_1.forEach(topProductions, function (topProd) {
	        var currRefsFollow = new ResyncFollowsWalker(topProd).startWalking();
	        reSyncFollows.putAll(currRefsFollow);
	    });
	    return reSyncFollows;
	}
	exports.computeAllProdsFollows = computeAllProdsFollows;
	function buildBetweenProdsFollowPrefix(inner, occurenceInParent) {
	    return inner.name + occurenceInParent + constants_1.IN;
	}
	exports.buildBetweenProdsFollowPrefix = buildBetweenProdsFollowPrefix;
	function buildInProdFollowPrefix(terminal) {
	    var terminalName = tokens_public_1.tokenName(terminal.terminalType);
	    return terminalName + terminal.occurrenceInParent + constants_1.IN;
	}
	exports.buildInProdFollowPrefix = buildInProdFollowPrefix;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var gast_public_1 = __webpack_require__(7);
	var utils_1 = __webpack_require__(4);
	/**
	 *  A Grammar Walker that computes the "remaining" grammar "after" a productions in the grammar.
	 */
	var RestWalker = (function () {
	    function RestWalker() {
	    }
	    RestWalker.prototype.walk = function (prod, prevRest) {
	        var _this = this;
	        if (prevRest === void 0) { prevRest = []; }
	        utils_1.forEach(prod.definition, function (subProd, index) {
	            var currRest = utils_1.drop(prod.definition, index + 1);
	            if (subProd instanceof gast_public_1.gast.NonTerminal) {
	                _this.walkProdRef(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.Terminal) {
	                _this.walkTerminal(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.Flat) {
	                _this.walkFlat(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.Option) {
	                _this.walkOption(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.RepetitionMandatory) {
	                _this.walkAtLeastOne(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.RepetitionMandatoryWithSeparator) {
	                _this.walkAtLeastOneSep(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.RepetitionWithSeparator) {
	                _this.walkManySep(subProd, currRest, prevRest);
	            }
	            else if (subProd instanceof gast_public_1.gast.Repetition) {
	                _this.walkMany(subProd, currRest, prevRest);
	            }/* istanbul ignore else */ 
	            else if (subProd instanceof gast_public_1.gast.Alternation) {
	                _this.walkOr(subProd, currRest, prevRest);
	            }
	            else {
	                /* istanbul ignore next */ throw Error("non exhaustive match");
	            }
	        });
	    };
	    RestWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) { };
	    RestWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) { };
	    RestWalker.prototype.walkFlat = function (flatProd, currRest, prevRest) {
	        // ABCDEF => after the D the rest is EF
	        var fullOrRest = currRest.concat(prevRest);
	        this.walk(flatProd, fullOrRest);
	    };
	    RestWalker.prototype.walkOption = function (optionProd, currRest, prevRest) {
	        // ABC(DE)?F => after the (DE)? the rest is F
	        var fullOrRest = currRest.concat(prevRest);
	        this.walk(optionProd, fullOrRest);
	    };
	    RestWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
	        // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
	        var fullAtLeastOneRest = [new gast_public_1.gast.Option(atLeastOneProd.definition)].concat(currRest, prevRest);
	        this.walk(atLeastOneProd, fullAtLeastOneRest);
	    };
	    RestWalker.prototype.walkAtLeastOneSep = function (atLeastOneSepProd, currRest, prevRest) {
	        // ABC DE(,DE)* F => after the (,DE)+ the rest is (,DE)?F
	        var fullAtLeastOneSepRest = restForRepetitionWithSeparator(atLeastOneSepProd, currRest, prevRest);
	        this.walk(atLeastOneSepProd, fullAtLeastOneSepRest);
	    };
	    RestWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
	        // ABC(DE)*F => after the (DE)* the rest is (DE)?F
	        var fullManyRest = [new gast_public_1.gast.Option(manyProd.definition)].concat(currRest, prevRest);
	        this.walk(manyProd, fullManyRest);
	    };
	    RestWalker.prototype.walkManySep = function (manySepProd, currRest, prevRest) {
	        // ABC (DE(,DE)*)? F => after the (,DE)* the rest is (,DE)?F
	        var fullManySepRest = restForRepetitionWithSeparator(manySepProd, currRest, prevRest);
	        this.walk(manySepProd, fullManySepRest);
	    };
	    RestWalker.prototype.walkOr = function (orProd, currRest, prevRest) {
	        var _this = this;
	        // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
	        var fullOrRest = currRest.concat(prevRest);
	        // walk all different alternatives
	        utils_1.forEach(orProd.definition, function (alt) {
	            // wrapping each alternative in a single definition wrapper
	            // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
	            // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
	            var prodWrapper = new gast_public_1.gast.Flat([alt]);
	            _this.walk(prodWrapper, fullOrRest);
	        });
	    };
	    return RestWalker;
	}());
	exports.RestWalker = RestWalker;
	function restForRepetitionWithSeparator(repSepProd, currRest, prevRest) {
	    var repSepRest = [new gast_public_1.gast.Option([new gast_public_1.gast.Terminal(repSepProd.separator)].concat(repSepProd.definition))];
	    var fullRepSepRest = repSepRest.concat(currRest, prevRest);
	    return fullRepSepRest;
	}


/***/ },
/* 16 */
/***/ function(module, exports) {

	"use strict";
	// TODO: can this be removed? where is it used?
	exports.IN = "_~IN~_";


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var gast_public_1 = __webpack_require__(7);
	var first_1 = __webpack_require__(13);
	var interpreter_1 = __webpack_require__(18);
	var utils_1 = __webpack_require__(4);
	var tokens_public_1 = __webpack_require__(10);
	function buildLookaheadForTopLevel(rule) {
	    var restProd = new gast_public_1.gast.Flat(rule.definition);
	    var possibleTokTypes = first_1.first(restProd);
	    return getSimpleLookahead(possibleTokTypes);
	}
	exports.buildLookaheadForTopLevel = buildLookaheadForTopLevel;
	function buildLookaheadForOption(optionOccurrence, ruleGrammar) {
	    return buildLookAheadForGrammarProd(interpreter_1.NextInsideOptionWalker, optionOccurrence, ruleGrammar);
	}
	exports.buildLookaheadForOption = buildLookaheadForOption;
	function buildLookaheadForMany(manyOccurrence, ruleGrammar) {
	    return buildLookAheadForGrammarProd(interpreter_1.NextInsideManyWalker, manyOccurrence, ruleGrammar);
	}
	exports.buildLookaheadForMany = buildLookaheadForMany;
	function buildLookaheadForManySep(manyOccurrence, ruleGrammar) {
	    return buildLookAheadForGrammarProd(interpreter_1.NextInsideManySepWalker, manyOccurrence, ruleGrammar);
	}
	exports.buildLookaheadForManySep = buildLookaheadForManySep;
	function buildLookaheadForAtLeastOne(manyOccurrence, ruleGrammar) {
	    return buildLookAheadForGrammarProd(interpreter_1.NextInsideAtLeastOneWalker, manyOccurrence, ruleGrammar);
	}
	exports.buildLookaheadForAtLeastOne = buildLookaheadForAtLeastOne;
	function buildLookaheadForAtLeastOneSep(manyOccurrence, ruleGrammar) {
	    return buildLookAheadForGrammarProd(interpreter_1.NextInsideAtLeastOneSepWalker, manyOccurrence, ruleGrammar);
	}
	exports.buildLookaheadForAtLeastOneSep = buildLookaheadForAtLeastOneSep;
	function buildLookaheadForOr(orOccurrence, ruleGrammar, ignoreAmbiguities) {
	    if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
	    var alternativesTokens = new interpreter_1.NextInsideOrWalker(ruleGrammar, orOccurrence).startWalking();
	    if (!ignoreAmbiguities) {
	        checkForOrAmbiguities(alternativesTokens, orOccurrence, ruleGrammar);
	    }
	    var hasLastAnEmptyAlt = utils_1.isEmpty(utils_1.last(alternativesTokens));
	    if (hasLastAnEmptyAlt) {
	        var lastIdx_1 = alternativesTokens.length - 1;
	        /**
	         * This will return the Index of the alternative to take or the <lastidx> if only the empty alternative matched
	         */
	        return function chooseAlternativeWithEmptyAlt() {
	            var nextToken = this.NEXT_TOKEN();
	            // checking only until length - 1 because there is nothing to check in an empty alternative, it is always valid
	            for (var i = 0; i < lastIdx_1; i++) {
	                var currAltTokens = alternativesTokens[i];
	                // 'for' loop for performance reasons.
	                for (var j = 0; j < currAltTokens.length; j++) {
	                    if (nextToken instanceof currAltTokens[j]) {
	                        return i;
	                    }
	                }
	            }
	            // an OR(alternation) with an empty alternative will always match
	            return lastIdx_1;
	        };
	    }
	    else {
	        /**
	         * This will return the Index of the alternative to take or -1 if none of the alternatives match
	         */
	        return function chooseAlternative() {
	            var nextToken = this.NEXT_TOKEN();
	            for (var i = 0; i < alternativesTokens.length; i++) {
	                var currAltTokens = alternativesTokens[i];
	                // 'for' loop for performance reasons.
	                for (var j = 0; j < currAltTokens.length; j++) {
	                    if (nextToken instanceof currAltTokens[j]) {
	                        return i;
	                    }
	                }
	            }
	            return -1;
	        };
	    }
	}
	exports.buildLookaheadForOr = buildLookaheadForOr;
	function checkForOrAmbiguities(alternativesTokens, orOccurrence, ruleGrammar) {
	    var altsAmbiguityErrors = checkAlternativesAmbiguities(alternativesTokens);
	    if (!utils_1.isEmpty(altsAmbiguityErrors)) {
	        var errorMessages = utils_1.map(altsAmbiguityErrors, function (currAmbiguity) {
	            return ("Ambiguous alternatives: <" + currAmbiguity.alts.join(" ,") + "> in <OR" + orOccurrence + "> inside <" + ruleGrammar.name + "> ") +
	                ("Rule, <" + tokens_public_1.tokenName(currAmbiguity.token) + "> may appears as the first Terminal in all these alternatives.\n");
	        });
	        throw new Error(errorMessages.join("\n ---------------- \n") +
	            "To Resolve this, either: \n" +
	            "1. refactor your grammar to be LL(1)\n" +
	            "2. provide explicit lookahead functions in the form {WHEN:laFunc, THEN_DO:...}\n" +
	            "3. Add ignore arg to this OR Production:\n" +
	            "OR([], 'msg', recognizer.IGNORE_AMBIGUITIES)\n" +
	            "In that case the parser will always pick the first alternative that" +
	            " matches and ignore all the others");
	    }
	}
	exports.checkForOrAmbiguities = checkForOrAmbiguities;
	function checkAlternativesAmbiguities(alternativesTokens) {
	    var allTokensFlat = utils_1.flatten(alternativesTokens);
	    var uniqueTokensFlat = utils_1.uniq(allTokensFlat);
	    var tokensToAltsIndicesItAppearsIn = utils_1.map(uniqueTokensFlat, function (seekToken) {
	        var altsCurrTokenAppearsIn = utils_1.pick(alternativesTokens, function (altToLookIn) {
	            return utils_1.find(altToLookIn, function (currToken) {
	                return currToken === seekToken;
	            });
	        });
	        var altsIndicesTokenAppearsIn = utils_1.map(utils_1.keys(altsCurrTokenAppearsIn), function (index) {
	            return parseInt(index, 10) + 1;
	        });
	        return { token: seekToken, alts: altsIndicesTokenAppearsIn };
	    });
	    var tokensToAltsIndicesWithAmbiguity = utils_1.filter(tokensToAltsIndicesItAppearsIn, function (tokAndAltsItAppearsIn) {
	        return tokAndAltsItAppearsIn.alts.length > 1;
	    });
	    return tokensToAltsIndicesWithAmbiguity;
	}
	exports.checkAlternativesAmbiguities = checkAlternativesAmbiguities;
	function buildLookAheadForGrammarProd(prodWalkerConstructor, ruleOccurrence, ruleGrammar) {
	    var path = {
	        ruleStack: [ruleGrammar.name],
	        occurrenceStack: [1],
	        occurrence: ruleOccurrence
	    };
	    var walker = new prodWalkerConstructor(ruleGrammar, path);
	    var possibleNextTokTypes = walker.startWalking();
	    return getSimpleLookahead(possibleNextTokTypes);
	}
	function getSimpleLookahead(possibleNextTokTypes) {
	    return function () {
	        var nextToken = this.NEXT_TOKEN();
	        for (var j = 0; j < possibleNextTokTypes.length; j++) {
	            if (nextToken instanceof possibleNextTokTypes[j]) {
	                return true;
	            }
	        }
	        return false;
	    };
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    /* istanbul ignore next */  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var rest_1 = __webpack_require__(15);
	var gast_public_1 = __webpack_require__(7);
	/* tslint:disable:no-use-before-declare */
	var utils_1 = __webpack_require__(4);
	/* tslint:enable:no-use-before-declare */
	var tokens_public_1 = __webpack_require__(10);
	var first_1 = __webpack_require__(13);
	var AbstractNextPossibleTokensWalker = (function (_super) {
	    __extends(AbstractNextPossibleTokensWalker, _super);
	    function AbstractNextPossibleTokensWalker(topProd, path) {
	        _super.call(this);
	        this.topProd = topProd;
	        this.path = path;
	        this.possibleTokTypes = [];
	        this.nextProductionName = "";
	        this.nextProductionOccurrence = 0;
	        this.found = false;
	        this.isAtEndOfPath = false;
	    }
	    AbstractNextPossibleTokensWalker.prototype.startWalking = function () {
	        this.found = false;
	        if (this.path.ruleStack[0] !== this.topProd.name) {
	            throw Error("The path does not start with the walker's top Rule!");
	        }
	        // immutable for the win
	        this.ruleStack = (utils_1.cloneArr(this.path.ruleStack)).reverse(); // intelij bug requires assertion
	        this.occurrenceStack = (utils_1.cloneArr(this.path.occurrenceStack)).reverse(); // intelij bug requires assertion
	        // already verified that the first production is valid, we now seek the 2nd production
	        this.ruleStack.pop();
	        this.occurrenceStack.pop();
	        this.updateExpectedNext();
	        this.walk(this.topProd);
	        return this.possibleTokTypes;
	    };
	    AbstractNextPossibleTokensWalker.prototype.walk = function (prod, prevRest) {
	        if (prevRest === void 0) { prevRest = []; }
	        // stop scanning once we found the path
	        if (!this.found) {
	            _super.prototype.walk.call(this, prod, prevRest);
	        }
	    };
	    AbstractNextPossibleTokensWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) {
	        // found the next production, need to keep walking in it
	        if (refProd.referencedRule.name === this.nextProductionName &&
	            refProd.occurrenceInParent === this.nextProductionOccurrence) {
	            var fullRest = currRest.concat(prevRest);
	            this.updateExpectedNext();
	            this.walk(refProd.referencedRule, fullRest);
	        }
	    };
	    AbstractNextPossibleTokensWalker.prototype.updateExpectedNext = function () {
	        // need to consume the Terminal
	        if (utils_1.isEmpty(this.ruleStack)) {
	            // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
	            // really seeking is the last Terminal...
	            this.nextProductionName = "";
	            this.nextProductionOccurrence = 0;
	            this.isAtEndOfPath = true;
	        }
	        else {
	            this.nextProductionName = this.ruleStack.pop();
	            this.nextProductionOccurrence = this.occurrenceStack.pop();
	        }
	    };
	    return AbstractNextPossibleTokensWalker;
	}(rest_1.RestWalker));
	exports.AbstractNextPossibleTokensWalker = AbstractNextPossibleTokensWalker;
	var NextAfterTokenWalker = (function (_super) {
	    __extends(NextAfterTokenWalker, _super);
	    function NextAfterTokenWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextTerminalName = "";
	        this.nextTerminalOccurrence = 0;
	        this.nextTerminalName = tokens_public_1.tokenName(this.path.lastTok);
	        this.nextTerminalOccurrence = this.path.lastTokOccurrence;
	    }
	    NextAfterTokenWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) {
	        if (this.isAtEndOfPath && tokens_public_1.tokenName(terminal.terminalType) === this.nextTerminalName &&
	            terminal.occurrenceInParent === this.nextTerminalOccurrence && !(this.found)) {
	            var fullRest = currRest.concat(prevRest);
	            var restProd = new gast_public_1.gast.Flat(fullRest);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	    };
	    return NextAfterTokenWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextAfterTokenWalker = NextAfterTokenWalker;
	var NextInsideOptionWalker = (function (_super) {
	    __extends(NextInsideOptionWalker, _super);
	    function NextInsideOptionWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextOptionOccurrence = 0;
	        this.nextOptionOccurrence = this.path.occurrence;
	    }
	    NextInsideOptionWalker.prototype.walkOption = function (optionProd, currRest, prevRest) {
	        if (this.isAtEndOfPath && optionProd.occurrenceInParent === this.nextOptionOccurrence && !(this.found)) {
	            var restProd = new gast_public_1.gast.Flat(optionProd.definition);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	        else {
	            _super.prototype.walkOption.call(this, optionProd, currRest, prevRest);
	        }
	    };
	    return NextInsideOptionWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextInsideOptionWalker = NextInsideOptionWalker;
	var NextInsideManyWalker = (function (_super) {
	    __extends(NextInsideManyWalker, _super);
	    function NextInsideManyWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextOccurrence = 0;
	        this.nextOccurrence = this.path.occurrence;
	    }
	    NextInsideManyWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
	        if (this.isAtEndOfPath && manyProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
	            var restProd = new gast_public_1.gast.Flat(manyProd.definition);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	        else {
	            _super.prototype.walkMany.call(this, manyProd, currRest, prevRest);
	        }
	    };
	    return NextInsideManyWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextInsideManyWalker = NextInsideManyWalker;
	var NextInsideManySepWalker = (function (_super) {
	    __extends(NextInsideManySepWalker, _super);
	    function NextInsideManySepWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextOccurrence = 0;
	        this.nextOccurrence = this.path.occurrence;
	    }
	    NextInsideManySepWalker.prototype.walkManySep = function (manySepProd, currRest, prevRest) {
	        if (this.isAtEndOfPath && manySepProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
	            var restProd = new gast_public_1.gast.Flat(manySepProd.definition);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	        else {
	            _super.prototype.walkManySep.call(this, manySepProd, currRest, prevRest);
	        }
	    };
	    return NextInsideManySepWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextInsideManySepWalker = NextInsideManySepWalker;
	var NextInsideAtLeastOneWalker = (function (_super) {
	    __extends(NextInsideAtLeastOneWalker, _super);
	    function NextInsideAtLeastOneWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextOccurrence = 0;
	        this.nextOccurrence = this.path.occurrence;
	    }
	    NextInsideAtLeastOneWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
	        if (this.isAtEndOfPath && atLeastOneProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
	            var restProd = new gast_public_1.gast.Flat(atLeastOneProd.definition);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	        else {
	            _super.prototype.walkAtLeastOne.call(this, atLeastOneProd, currRest, prevRest);
	        }
	    };
	    return NextInsideAtLeastOneWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextInsideAtLeastOneWalker = NextInsideAtLeastOneWalker;
	var NextInsideAtLeastOneSepWalker = (function (_super) {
	    __extends(NextInsideAtLeastOneSepWalker, _super);
	    function NextInsideAtLeastOneSepWalker(topProd, path) {
	        _super.call(this, topProd, path);
	        this.path = path;
	        this.nextOccurrence = 0;
	        this.nextOccurrence = this.path.occurrence;
	    }
	    NextInsideAtLeastOneSepWalker.prototype.walkAtLeastOneSep = function (atLeastOneSepProd, currRest, prevRest) {
	        if (this.isAtEndOfPath && atLeastOneSepProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
	            var restProd = new gast_public_1.gast.Flat(atLeastOneSepProd.definition);
	            this.possibleTokTypes = first_1.first(restProd);
	            this.found = true;
	        }
	        else {
	            _super.prototype.walkAtLeastOneSep.call(this, atLeastOneSepProd, currRest, prevRest);
	        }
	    };
	    return NextInsideAtLeastOneSepWalker;
	}(AbstractNextPossibleTokensWalker));
	exports.NextInsideAtLeastOneSepWalker = NextInsideAtLeastOneSepWalker;
	var NextInsideOrWalker = (function (_super) {
	    __extends(NextInsideOrWalker, _super);
	    function NextInsideOrWalker(topRule, occurrence) {
	        _super.call(this);
	        this.topRule = topRule;
	        this.occurrence = occurrence;
	        this.result = [];
	    }
	    NextInsideOrWalker.prototype.startWalking = function () {
	        this.walk(this.topRule);
	        return this.result;
	    };
	    NextInsideOrWalker.prototype.walkOr = function (orProd, currRest, prevRest) {
	        if (orProd.occurrenceInParent === this.occurrence) {
	            this.result = utils_1.map(orProd.definition, function (alt) {
	                var altWrapper = new gast_public_1.gast.Flat([alt]);
	                return first_1.first(altWrapper);
	            });
	        }
	        else {
	            _super.prototype.walkOr.call(this, orProd, currRest, prevRest);
	        }
	    };
	    return NextInsideOrWalker;
	}(rest_1.RestWalker));
	exports.NextInsideOrWalker = NextInsideOrWalker;
	/**
	 * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
	 * it never "follows" production refs
	 */
	var AbstractNextTerminalAfterProductionWalker = (function (_super) {
	    __extends(AbstractNextTerminalAfterProductionWalker, _super);
	    function AbstractNextTerminalAfterProductionWalker(topRule, occurrence) {
	        _super.call(this);
	        this.topRule = topRule;
	        this.occurrence = occurrence;
	        this.result = { token: undefined, occurrence: undefined, isEndOfRule: undefined };
	    }
	    AbstractNextTerminalAfterProductionWalker.prototype.startWalking = function () {
	        this.walk(this.topRule);
	        return this.result;
	    };
	    return AbstractNextTerminalAfterProductionWalker;
	}(rest_1.RestWalker));
	exports.AbstractNextTerminalAfterProductionWalker = AbstractNextTerminalAfterProductionWalker;
	var NextTerminalAfterManyWalker = (function (_super) {
	    __extends(NextTerminalAfterManyWalker, _super);
	    function NextTerminalAfterManyWalker() {
	        _super.apply(this, arguments);
	    }
	    NextTerminalAfterManyWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
	        if (manyProd.occurrenceInParent === this.occurrence) {
	            var firstAfterMany = utils_1.first(currRest.concat(prevRest));
	            this.result.isEndOfRule = firstAfterMany === undefined;
	            if (firstAfterMany instanceof gast_public_1.gast.Terminal) {
	                this.result.token = firstAfterMany.terminalType;
	                this.result.occurrence = firstAfterMany.occurrenceInParent;
	            }
	        }
	        else {
	            _super.prototype.walkMany.call(this, manyProd, currRest, prevRest);
	        }
	    };
	    return NextTerminalAfterManyWalker;
	}(AbstractNextTerminalAfterProductionWalker));
	exports.NextTerminalAfterManyWalker = NextTerminalAfterManyWalker;
	var NextTerminalAfterManySepWalker = (function (_super) {
	    __extends(NextTerminalAfterManySepWalker, _super);
	    function NextTerminalAfterManySepWalker() {
	        _super.apply(this, arguments);
	    }
	    NextTerminalAfterManySepWalker.prototype.walkManySep = function (manySepProd, currRest, prevRest) {
	        if (manySepProd.occurrenceInParent === this.occurrence) {
	            var firstAfterManySep = utils_1.first(currRest.concat(prevRest));
	            this.result.isEndOfRule = firstAfterManySep === undefined;
	            if (firstAfterManySep instanceof gast_public_1.gast.Terminal) {
	                this.result.token = firstAfterManySep.terminalType;
	                this.result.occurrence = firstAfterManySep.occurrenceInParent;
	            }
	        }
	        else {
	            _super.prototype.walkManySep.call(this, manySepProd, currRest, prevRest);
	        }
	    };
	    return NextTerminalAfterManySepWalker;
	}(AbstractNextTerminalAfterProductionWalker));
	exports.NextTerminalAfterManySepWalker = NextTerminalAfterManySepWalker;
	var NextTerminalAfterAtLeastOneWalker = (function (_super) {
	    __extends(NextTerminalAfterAtLeastOneWalker, _super);
	    function NextTerminalAfterAtLeastOneWalker() {
	        _super.apply(this, arguments);
	    }
	    NextTerminalAfterAtLeastOneWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
	        if (atLeastOneProd.occurrenceInParent === this.occurrence) {
	            var firstAfterAtLeastOne = utils_1.first(currRest.concat(prevRest));
	            this.result.isEndOfRule = firstAfterAtLeastOne === undefined;
	            if (firstAfterAtLeastOne instanceof gast_public_1.gast.Terminal) {
	                this.result.token = firstAfterAtLeastOne.terminalType;
	                this.result.occurrence = firstAfterAtLeastOne.occurrenceInParent;
	            }
	        }
	        else {
	            _super.prototype.walkAtLeastOne.call(this, atLeastOneProd, currRest, prevRest);
	        }
	    };
	    return NextTerminalAfterAtLeastOneWalker;
	}(AbstractNextTerminalAfterProductionWalker));
	exports.NextTerminalAfterAtLeastOneWalker = NextTerminalAfterAtLeastOneWalker;
	// TODO: reduce code duplication in the AfterWalkers
	var NextTerminalAfterAtLeastOneSepWalker = (function (_super) {
	    __extends(NextTerminalAfterAtLeastOneSepWalker, _super);
	    function NextTerminalAfterAtLeastOneSepWalker() {
	        _super.apply(this, arguments);
	    }
	    NextTerminalAfterAtLeastOneSepWalker.prototype.walkAtLeastOneSep = function (atleastOneSepProd, currRest, prevRest) {
	        if (atleastOneSepProd.occurrenceInParent === this.occurrence) {
	            var firstAfterfirstAfterAtLeastOneSep = utils_1.first(currRest.concat(prevRest));
	            this.result.isEndOfRule = firstAfterfirstAfterAtLeastOneSep === undefined;
	            if (firstAfterfirstAfterAtLeastOneSep instanceof gast_public_1.gast.Terminal) {
	                this.result.token = firstAfterfirstAfterAtLeastOneSep.terminalType;
	                this.result.occurrence = firstAfterfirstAfterAtLeastOneSep.occurrenceInParent;
	            }
	        }
	        else {
	            _super.prototype.walkAtLeastOneSep.call(this, atleastOneSepProd, currRest, prevRest);
	        }
	    };
	    return NextTerminalAfterAtLeastOneSepWalker;
	}(AbstractNextTerminalAfterProductionWalker));
	exports.NextTerminalAfterAtLeastOneSepWalker = NextTerminalAfterAtLeastOneSepWalker;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var range_1 = __webpack_require__(20);
	var gast_public_1 = __webpack_require__(7);
	var utils_1 = __webpack_require__(4);
	(function (ProdType) {
	    ProdType[ProdType["OPTION"] = 0] = "OPTION";
	    ProdType[ProdType["OR"] = 1] = "OR";
	    ProdType[ProdType["MANY"] = 2] = "MANY";
	    ProdType[ProdType["MANY_SEP"] = 3] = "MANY_SEP";
	    ProdType[ProdType["AT_LEAST_ONE"] = 4] = "AT_LEAST_ONE";
	    ProdType[ProdType["AT_LEAST_ONE_SEP"] = 5] = "AT_LEAST_ONE_SEP";
	    ProdType[ProdType["REF"] = 6] = "REF";
	    ProdType[ProdType["TERMINAL"] = 7] = "TERMINAL";
	    ProdType[ProdType["FLAT"] = 8] = "FLAT";
	})(exports.ProdType || (exports.ProdType = {}));
	var ProdType = exports.ProdType;
	// TODO: this regexp creates a constraint on names of Terminals (Tokens).
	// TODO: document and consider reducing the constraint by expanding the regexp
	var terminalRegEx = /\.\s*CONSUME(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
	var terminalRegGlobal = new RegExp(terminalRegEx.source, "g");
	var refRegEx = /\.\s*SUBRULE(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
	var refRegExGlobal = new RegExp(refRegEx.source, "g");
	var optionRegEx = /\.\s*OPTION(\d)?\s*\(/;
	var optionRegExGlobal = new RegExp(optionRegEx.source, "g");
	var manyRegEx = /\.\s*MANY(\d)?\s*\(/;
	var manyRegExGlobal = new RegExp(manyRegEx.source, "g");
	var manyWithSeparatorRegEx = /\.\s*MANY_SEP(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
	var manyWithSeparatorRegExGlobal = new RegExp(manyWithSeparatorRegEx.source, "g");
	var atLeastOneWithSeparatorRegEx = /\.\s*AT_LEAST_ONE_SEP(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
	var atLeastOneWithSeparatorRegExGlobal = new RegExp(atLeastOneWithSeparatorRegEx.source, "g");
	var atLeastOneRegEx = /\.\s*AT_LEAST_ONE(\d)?\s*\(/;
	var atLeastOneRegExGlobal = new RegExp(atLeastOneRegEx.source, "g");
	var orRegEx = /\.\s*OR(\d)?\s*\(/;
	var orRegExGlobal = new RegExp(orRegEx.source, "g");
	var orPartRegEx = /{\s*(WHEN|ALT)\s*:/g;
	exports.terminalNameToConstructor = {};
	function buildTopProduction(impelText, name, terminals) {
	    // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
	    // TODO: this is confusing, might be time to create a class..
	    exports.terminalNameToConstructor = terminals;
	    // the top most range must strictly contain all the other ranges
	    // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
	    var spacedImpelText = " " + impelText;
	    // TODO: why do we add whitespace twice?
	    var txtWithoutComments = removeComments(" " + spacedImpelText);
	    var textWithoutCommentsAndStrings = removeStringLiterals(txtWithoutComments);
	    var prodRanges = createRanges(textWithoutCommentsAndStrings);
	    var topRange = new range_1.Range(0, impelText.length + 2);
	    return buildTopLevel(name, topRange, prodRanges, impelText);
	}
	exports.buildTopProduction = buildTopProduction;
	function buildTopLevel(name, topRange, allRanges, orgText) {
	    var topLevelProd = new gast_public_1.gast.Rule(name, [], orgText);
	    return buildAbstractProd(topLevelProd, topRange, allRanges);
	}
	function buildProdGast(prodRange, allRanges) {
	    "use strict";
	    switch (prodRange.type) {
	        case ProdType.AT_LEAST_ONE:
	            return buildAtLeastOneProd(prodRange, allRanges);
	        case ProdType.AT_LEAST_ONE_SEP:
	            return buildAtLeastOneSepProd(prodRange, allRanges);
	        case ProdType.MANY_SEP:
	            return buildManySepProd(prodRange, allRanges);
	        case ProdType.MANY:
	            return buildManyProd(prodRange, allRanges);
	        case ProdType.OPTION:
	            return buildOptionProd(prodRange, allRanges);
	        case ProdType.OR:
	            return buildOrProd(prodRange, allRanges);
	        case ProdType.FLAT:
	            return buildAbstractProd(new gast_public_1.gast.Flat([]), prodRange.range, allRanges);
	        case ProdType.REF:
	            return buildRefProd(prodRange);
	        case ProdType.TERMINAL:
	            return buildTerminalProd(prodRange);
	        /* istanbul ignore next */
	        default:
	            /* istanbul ignore next */ throw Error("non exhaustive match");
	    }
	}
	exports.buildProdGast = buildProdGast;
	function buildRefProd(prodRange) {
	    var reResult = refRegEx.exec(prodRange.text);
	    var isImplicitOccurrenceIdx = reResult[1] === undefined;
	    var refOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
	    var refProdName = reResult[2];
	    var newRef = new gast_public_1.gast.NonTerminal(refProdName, undefined, refOccurrence);
	    newRef.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
	    return newRef;
	}
	function buildTerminalProd(prodRange) {
	    var reResult = terminalRegEx.exec(prodRange.text);
	    var isImplicitOccurrenceIdx = reResult[1] === undefined;
	    var terminalOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
	    var terminalName = reResult[2];
	    var terminalType = exports.terminalNameToConstructor[terminalName];
	    if (!terminalType) {
	        throw Error("Terminal Token name: " + terminalName + " not found");
	    }
	    var newTerminal = new gast_public_1.gast.Terminal(terminalType, terminalOccurrence);
	    newTerminal.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
	    return newTerminal;
	}
	function buildProdWithOccurrence(regEx, prodInstance, prodRange, allRanges) {
	    var reResult = regEx.exec(prodRange.text);
	    var isImplicitOccurrenceIdx = reResult[1] === undefined;
	    prodInstance.occurrenceInParent = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
	    prodInstance.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
	    // <any> due to intellij bugs
	    return buildAbstractProd(prodInstance, prodRange.range, allRanges);
	}
	function buildAtLeastOneProd(prodRange, allRanges) {
	    return buildProdWithOccurrence(atLeastOneRegEx, new gast_public_1.gast.RepetitionMandatory([]), prodRange, allRanges);
	}
	function buildAtLeastOneSepProd(prodRange, allRanges) {
	    return buildRepetitionWithSep(prodRange, allRanges, gast_public_1.gast.RepetitionMandatoryWithSeparator, atLeastOneWithSeparatorRegEx);
	}
	function buildManyProd(prodRange, allRanges) {
	    return buildProdWithOccurrence(manyRegEx, new gast_public_1.gast.Repetition([]), prodRange, allRanges);
	}
	function buildManySepProd(prodRange, allRanges) {
	    return buildRepetitionWithSep(prodRange, allRanges, gast_public_1.gast.RepetitionWithSeparator, manyWithSeparatorRegEx);
	}
	function buildRepetitionWithSep(prodRange, allRanges, repConstructor, regExp) {
	    var reResult = regExp.exec(prodRange.text);
	    var isImplicitOccurrenceIdx = reResult[1] === undefined;
	    var occurrenceIdx = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
	    var sepName = reResult[2];
	    var separatorType = exports.terminalNameToConstructor[sepName];
	    if (!separatorType) {
	        throw Error("Separator Terminal Token name: " + sepName + " not found");
	    }
	    var repetitionInstance = new repConstructor([], separatorType, occurrenceIdx);
	    repetitionInstance.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
	    return buildAbstractProd(repetitionInstance, prodRange.range, allRanges);
	}
	function buildOptionProd(prodRange, allRanges) {
	    return buildProdWithOccurrence(optionRegEx, new gast_public_1.gast.Option([]), prodRange, allRanges);
	}
	function buildOrProd(prodRange, allRanges) {
	    return buildProdWithOccurrence(orRegEx, new gast_public_1.gast.Alternation([]), prodRange, allRanges);
	}
	function buildAbstractProd(prod, topLevelRange, allRanges) {
	    var secondLevelProds = getDirectlyContainedRanges(topLevelRange, allRanges);
	    var secondLevelInOrder = utils_1.sortBy(secondLevelProds, function (prodRng) { return prodRng.range.start; });
	    var definition = [];
	    utils_1.forEach(secondLevelInOrder, function (prodRng) {
	        definition.push(buildProdGast(prodRng, allRanges));
	    });
	    prod.definition = definition;
	    return prod;
	}
	function getDirectlyContainedRanges(y, prodRanges) {
	    return utils_1.filter(prodRanges, function (x) {
	        var isXDescendantOfY = y.strictlyContainsRange(x.range);
	        var xDoesNotHaveAnyAncestorWhichIsDecendantOfY = utils_1.every(prodRanges, function (maybeAnotherParent) {
	            var isParentOfX = maybeAnotherParent.range.strictlyContainsRange(x.range);
	            var isChildOfY = maybeAnotherParent.range.isStrictlyContainedInRange(y);
	            return !(isParentOfX && isChildOfY);
	        });
	        return isXDescendantOfY && xDoesNotHaveAnyAncestorWhichIsDecendantOfY;
	    });
	}
	exports.getDirectlyContainedRanges = getDirectlyContainedRanges;
	var singleLineCommentRegEx = /\/\/.*/g;
	var multiLineCommentRegEx = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
	var doubleQuoteStringLiteralRegEx = /"([^\\"]+|\\([bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/g;
	var singleQuoteStringLiteralRegEx = /'([^\\']+|\\([bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/g;
	function removeComments(text) {
	    var noSingleLine = text.replace(singleLineCommentRegEx, "");
	    var noComments = noSingleLine.replace(multiLineCommentRegEx, "");
	    return noComments;
	}
	exports.removeComments = removeComments;
	function removeStringLiterals(text) {
	    var noDoubleQuotes = text.replace(doubleQuoteStringLiteralRegEx, "");
	    var noSingleQuotes = noDoubleQuotes.replace(singleQuoteStringLiteralRegEx, "");
	    return noSingleQuotes;
	}
	exports.removeStringLiterals = removeStringLiterals;
	function createRanges(text) {
	    var terminalRanges = createTerminalRanges(text);
	    var refsRanges = createRefsRanges(text);
	    var atLeastOneRanges = createAtLeastOneRanges(text);
	    var atLeastOneSepRanges = createAtLeastOneSepRanges(text);
	    var manyRanges = createManyRanges(text);
	    var manySepRanges = createManySepRanges(text);
	    var optionRanges = createOptionRanges(text);
	    var orRanges = createOrRanges(text);
	    return [].concat(terminalRanges, refsRanges, atLeastOneRanges, atLeastOneSepRanges, manyRanges, manySepRanges, optionRanges, orRanges);
	}
	exports.createRanges = createRanges;
	function createTerminalRanges(text) {
	    return createRefOrTerminalProdRangeInternal(text, ProdType.TERMINAL, terminalRegGlobal);
	}
	exports.createTerminalRanges = createTerminalRanges;
	function createRefsRanges(text) {
	    return createRefOrTerminalProdRangeInternal(text, ProdType.REF, refRegExGlobal);
	}
	exports.createRefsRanges = createRefsRanges;
	function createAtLeastOneRanges(text) {
	    return createOperatorProdRangeParenthesis(text, ProdType.AT_LEAST_ONE, atLeastOneRegExGlobal);
	}
	exports.createAtLeastOneRanges = createAtLeastOneRanges;
	function createAtLeastOneSepRanges(text) {
	    return createOperatorProdRangeParenthesis(text, ProdType.AT_LEAST_ONE_SEP, atLeastOneWithSeparatorRegExGlobal);
	}
	exports.createAtLeastOneSepRanges = createAtLeastOneSepRanges;
	function createManyRanges(text) {
	    return createOperatorProdRangeParenthesis(text, ProdType.MANY, manyRegExGlobal);
	}
	exports.createManyRanges = createManyRanges;
	function createManySepRanges(text) {
	    return createOperatorProdRangeParenthesis(text, ProdType.MANY_SEP, manyWithSeparatorRegExGlobal);
	}
	exports.createManySepRanges = createManySepRanges;
	function createOptionRanges(text) {
	    return createOperatorProdRangeParenthesis(text, ProdType.OPTION, optionRegExGlobal);
	}
	exports.createOptionRanges = createOptionRanges;
	function createOrRanges(text) {
	    var orRanges = createOperatorProdRangeParenthesis(text, ProdType.OR, orRegExGlobal);
	    // have to split up the OR cases into separate FLAT productions
	    // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
	    var orSubPartsRanges = createOrPartRanges(orRanges);
	    return orRanges.concat(orSubPartsRanges);
	}
	exports.createOrRanges = createOrRanges;
	var findClosingCurly = utils_1.partial(findClosingOffset, "{", "}");
	var findClosingParen = utils_1.partial(findClosingOffset, "(", ")");
	function createOrPartRanges(orRanges) {
	    var orPartRanges = [];
	    utils_1.forEach(orRanges, function (orRange) {
	        var currOrParts = createOperatorProdRangeInternal(orRange.text, ProdType.FLAT, orPartRegEx, findClosingCurly);
	        var currOrRangeStart = orRange.range.start;
	        // fix offsets as we are working on a subset of the text
	        utils_1.forEach(currOrParts, function (orPart) {
	            orPart.range.start += currOrRangeStart;
	            orPart.range.end += currOrRangeStart;
	        });
	        orPartRanges = orPartRanges.concat(currOrParts);
	    });
	    var uniqueOrPartRanges = utils_1.uniq(orPartRanges, function (prodRange) {
	        // using "~" as a separator for the identify function as its not a valid char in javascript
	        return prodRange.type + "~" + prodRange.range.start + "~" + prodRange.range.end + "~" + prodRange.text;
	    });
	    return uniqueOrPartRanges;
	}
	exports.createOrPartRanges = createOrPartRanges;
	function createRefOrTerminalProdRangeInternal(text, prodType, pattern) {
	    var prodRanges = [];
	    var matched;
	    while (matched = pattern.exec(text)) {
	        var start = matched.index;
	        var stop = pattern.lastIndex;
	        var currRange = new range_1.Range(start, stop);
	        var currText = matched[0];
	        prodRanges.push({ range: currRange, text: currText, type: prodType });
	    }
	    return prodRanges;
	}
	function createOperatorProdRangeParenthesis(text, prodType, pattern) {
	    return createOperatorProdRangeInternal(text, prodType, pattern, findClosingParen);
	}
	function createOperatorProdRangeInternal(text, prodType, pattern, findTerminatorOffSet) {
	    var operatorRanges = [];
	    var matched;
	    while (matched = pattern.exec(text)) {
	        var start = matched.index;
	        // note that (start + matched[0].length) is the first character AFTER the match
	        var stop = findTerminatorOffSet(start + matched[0].length, text);
	        var currRange = new range_1.Range(start, stop);
	        var currText = text.substr(start, stop - start + 1);
	        operatorRanges.push({ range: currRange, text: currText, type: prodType });
	    }
	    return operatorRanges;
	}
	function findClosingOffset(opening, closing, start, text) {
	    var parenthesisStack = [1];
	    var i = -1;
	    while (!(utils_1.isEmpty(parenthesisStack)) && i + start < text.length) {
	        i++;
	        var nextChar = text.charAt(start + i);
	        if (nextChar === opening) {
	            parenthesisStack.push(1);
	        }
	        else if (nextChar === closing) {
	            parenthesisStack.pop();
	        }
	    }
	    // valid termination of the search loop
	    if (utils_1.isEmpty(parenthesisStack)) {
	        return i + start;
	    }
	    else {
	        throw new Error("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS");
	    }
	}
	exports.findClosingOffset = findClosingOffset;


/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";
	var Range = (function () {
	    function Range(start, end) {
	        this.start = start;
	        this.end = end;
	        if (!isValidRange(start, end)) {
	            throw new Error("INVALID RANGE");
	        }
	    }
	    Range.prototype.contains = function (num) {
	        return this.start <= num && this.end >= num;
	    };
	    Range.prototype.containsRange = function (other) {
	        return this.start <= other.start && this.end >= other.end;
	    };
	    Range.prototype.isContainedInRange = function (other) {
	        return other.containsRange(this);
	    };
	    Range.prototype.strictlyContainsRange = function (other) {
	        return this.start < other.start && this.end > other.end;
	    };
	    Range.prototype.isStrictlyContainedInRange = function (other) {
	        return other.strictlyContainsRange(this);
	    };
	    return Range;
	}());
	exports.Range = Range;
	function isValidRange(start, end) {
	    return !(start < 0 || end < start);
	}
	exports.isValidRange = isValidRange;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var cache_1 = __webpack_require__(2);
	/**
	 * Clears the chevrotain internal cache.
	 * This should not be used in regular work flows, This is intended for
	 * unique use cases for example: online playground where the a parser with the same name is initialized with
	 * different implementations multiple times.
	 */
	function clearCache() {
	    cache_1.clearCache();
	}
	exports.clearCache = clearCache;


/***/ }
/******/ ])
});
;