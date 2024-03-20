import Poll from "components/Poll"

const PollsDebug = (props) => {
    return <Poll
        options={[
            {
                id: "option_1",
                label: "I like Comty"
            },
            {
                id: "option_2",
                label: "I don't like Comty"
            },
            {
                id: "option_3",
                label: "I prefer Twitter"
            }
        ]}
    />
}

export default PollsDebug