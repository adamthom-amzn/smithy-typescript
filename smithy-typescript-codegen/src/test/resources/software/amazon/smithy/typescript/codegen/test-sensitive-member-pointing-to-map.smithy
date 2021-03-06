namespace smithy.example

service Example {
    version: "1.0.0",
    operations: [GetFoo]
}

operation GetFoo {
    input: GetFooInput
}

structure GetFooInput {
    @sensitive
    sensitiveFoo: NamesMap
}

map NamesMap {
    key: String,
    value: String
}
